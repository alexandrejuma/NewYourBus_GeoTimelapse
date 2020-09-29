"""
New York MTA Bus Pre-processing Spark Script

Responsible for Data Quality, Derived Fields and Aggregations
"""
from __future__ import print_function

from pyspark.sql.functions import concat, col, lit, udf, to_timestamp, \
    unix_timestamp, from_unixtime, when, date_trunc, count, avg, \
    sum, min, max, countDistinct, desc, asc
from pyspark.sql.types import IntegerType, StringType, LongType
from pyspark import StorageLevel
import re
import os
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#############################################################
# Data from Network MTA (Metropolitan Transport Authority)
# 	RecordedAtTime,DirectionRef,PublishedLineName,OriginName,
# 	OriginLat,OriginLong,DestinationName,DestinationLat,
# 	DestinationLong,VehicleRef,VehicleLocation.Latitude,
#	VehicleLocation.Longitude,NextStopPointName,
#	ArrivalProximityText,DistanceFromStop,ExpectedArrivalTime,
#	ScheduledArrivalTime 
#############################################################

# Global variables

SECONDS_IN_DAY=86400
MAX_DELAY_IN_SECS=1000
DAILY_FLIP_THRESHOLD_IN_SECS=80000
AGG_RESULT_DIR="/tmp/mta_agg"
CONSOLIDATED_RESULT_DIR="/tmp/results"
PARTITION_REGEX="^colapsed_ts=2017"

class MTABusModel:

	def read_data(self, spark, filename, record_limit):
		self.rawmtamodel = spark.read.csv(filename, header='true').limit(record_limit)

	def write_rawdata(self, spark, filename):
		return None

	def write_data(self, spark, filename):
		return None

	def preprocess_data(self, spark):
		get_nightly_route_udf = udf(lambda time: (1 if int(time[:2])
                            > 23 else 0), IntegerType())

		fix_time_udf = udf(lambda time: ('0' + str(int(time[:2]) % 24)
						   + str(time[2:]) if int(time[:2]) % 24
						   < 10 else str(int(time[:2]) % 24) + str(time[2:])),
						   StringType())

		get_scheduled_data_udf = udf(lambda scheduled, expected: expected[:10] \
									 + ' ' + scheduled, StringType())

		self.preprocessedmodel = self.rawmtamodel.withColumnRenamed('VehicleLocation.Latitude',
										  'VehicleLocationLatitude'
										  ).withColumnRenamed('VehicleLocation.Longitude'
				, 'VehicleLocationLongitude')
		self.preprocessedmodel = self.preprocessedmodel.dropna().where("ExpectedArrivalTime!='NA'"
									   ).where("ScheduledArrivalTime!='NA'")
		self.preprocessedmodel = self.preprocessedmodel.withColumn('DistanceFromStopInt',
								   self.preprocessedmodel.DistanceFromStop.cast('int'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('OriginPoint', concat(col('OriginLat'),
								   lit(','), col('OriginLong')))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('DestinationPoint',
								   concat(col('DestinationLat'), lit(','),
								   col('DestinationLong')))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('VehicleLocation',
								   concat(col('`VehicleLocationLatitude`'),
								   lit(','), col('`VehicleLocationLongitude`')))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('RecordedAtTimeTS',
								   to_timestamp('RecordedAtTime',
								   'yyyy-MM-dd HH:mm:ss'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('ExpectedArrivalTimeTS',
								   to_timestamp('ExpectedArrivalTime',
								   'yyyy-MM-dd HH:mm:ss'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('NextBusinessDay',
								   get_nightly_route_udf(col('ScheduledArrivalTime'
								   )))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('ScheduledArrivalTimeTempTS',
								   to_timestamp(get_scheduled_data_udf(fix_time_udf(col('ScheduledArrivalTime'
								   )), 'ExpectedArrivalTime'),
								   'yyyy-MM-dd HH:mm:ss'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('ScheduledArrivalTimeTS',
								   to_timestamp(when(col('NextBusinessDay')
								   == 0,
								   from_unixtime(col('ScheduledArrivalTimeTempTS'
								   ).cast('long') - SECONDS_IN_DAY).cast('timestamp'
								   )).otherwise(col('ScheduledArrivalTimeTempTS'
								   )), 'yyyy-MM-dd HH:mm:ss'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('DelayInSecsTemp',
								   col('ExpectedArrivalTimeTS'
								   ).cast(LongType())
								   - col('ScheduledArrivalTimeTS'
								   ).cast(LongType()))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('DelayInSecs', when(col('DelayInSecsTemp')
								   > DAILY_FLIP_THRESHOLD_IN_SECS, col('DelayInSecsTemp')
								   - SECONDS_IN_DAY).otherwise(col('DelayInSecsTemp')))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('RecordedAtTimeTSHr', date_trunc('hour',
								   'RecordedAtTimeTS'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('ExpectedArrivalTimeTSHr', date_trunc('hour'
								   , 'ExpectedArrivalTimeTS'))
		self.preprocessedmodel = self.preprocessedmodel.withColumn('ScheduledArrivalTimeTSHr', date_trunc('hour'
								   , 'ScheduledArrivalTimeTS'))
		self.preprocessedmodel = self.preprocessedmodel.drop(
		'RecordedAtTime',
		'ExpectedArrivalTime',
		'DistanceFromStop',
		'OriginLat',
		'OriginLong',
		'DestinationLat',
		'DestinationLong',
		'VehicleLocationLatitude',
		'VehicleLocationLongitude',
		'ScheduledArrivalTimeTempTS',
		'RecordedAtTimeTS',
		'ExpectedArrivalTimeTS',
		'ScheduledArrivalTimeTS',
		'ScheduledArrivalTime',
		'DelayInSecsTemp',
		)

	
	def aggregate_data(self, spark):
		self.aggregatedmodel = self.preprocessedmodel.groupBy('ScheduledArrivalTimeTSHr', 'DestinationName',
							'DestinationPoint').agg(
		countDistinct('VehicleRef').alias('DistinctCount_Vehicles'),
		countDistinct('PublishedLineName').alias('DistinctCount_Lines'),
		avg('DistanceFromStopInt').alias('AVG_DistanceFromStopInt'),
		min('DistanceFromStopInt').alias('MIN_DistanceFromStopInt'),
		max('DistanceFromStopInt').alias('MAX_DistanceFromStopInt'),
		sum('DistanceFromStopInt').alias('SUM_DistanceFromStopInt'),
		avg('DelayInSecs').alias('AVG_DelayInSecs'),
		min('DelayInSecs').alias('MIN_DelayInSecs'),
		max('DelayInSecs').alias('MAX_DelayInSecs'),
		sum('DelayInSecs').alias('SUM_DelayInSecs'),
		count('*').alias('RecCount'),
		)
		self.aggregatedmodel = self.aggregatedmodel.filter((col('AVG_DelayInSecs') < MAX_DELAY_IN_SECS)
							   & (col('AVG_DelayInSecs') > 0))
		max_avg_delay = self.aggregatedmodel.agg(max('AVG_DelayInSecs'
								   )).collect()[0].__getattr__('max(AVG_DelayInSecs)'
				)
		self.aggregatedmodel = self.aggregatedmodel.withColumn('HeatMapIntensity', col('AVG_DelayInSecs')
								   / max_avg_delay)
		self.aggregatedmodel = self.aggregatedmodel.withColumn('colapsed_ts',
								   from_unixtime(unix_timestamp(self.aggregatedmodel.ScheduledArrivalTimeTSHr),
								   'yyyyMMddHH'))
		self.destination_list = self.aggregatedmodel.select("DestinationName").distinct().toJSON().map(lambda j: json.loads(j)).collect()
		self.timeslot_list = self.aggregatedmodel.select("colapsed_ts").distinct().toJSON().map(lambda j: json.loads(j)).collect()
		

	def write_results(self, spark):
		self.aggregatedmodel.write.partitionBy('colapsed_ts').mode('overwrite').format('csv'
			).save(AGG_RESULT_DIR)
	
		pattern = re.compile(PARTITION_REGEX)
		os.mkdir(CONSOLIDATED_RESULT_DIR)
	
		for filename in os.listdir(AGG_RESULT_DIR):
			if pattern.match(filename):
				new_dir = AGG_RESULT_DIR + '/' + filename.split('=')[1]
				#print(filename + ' -> ' + new_dir)
				os.system('mv '+ AGG_RESULT_DIR + '/' + filename + ' ' + new_dir)
				os.system('cat ' + new_dir + '/part*csv > ' + CONSOLIDATED_RESULT_DIR + '/'
						  + filename.split('=')[1] + '.csv')
	
		os.system('rm -rf /tmp/mta_agg')


	def __init__(self, spark, filename, record_limit):
		logger.info("Loading file: " + filename)
		self.read_data(spark, filename, record_limit)
		logger.info("Pre-processing raw data")
		self.preprocess_data(spark)
		logger.info("Aggregating pre-processed data")
		self.aggregate_data(spark)
		logger.info("Persisting dataframe in memory (hopefully)")
		self.aggregatedmodel.persist(StorageLevel.MEMORY_ONLY)
		self.rawmtamodel.unpersist()
		self.preprocessedmodel.unpersist()
		#logger.info("Generating CSV Files")
		#self.write_results(spark)

	def full_heatmap_data(self, spark):
		return self.aggregatedmodel.toJSON().map(lambda j: json.loads(j)).collect()

	def filtered_heatmap_data_for_destination(self, spark, destination):
		return self.aggregatedmodel.filter(col("DestinationName").rlike(str(destination))).toJSON().map(lambda j: json.loads(j)).collect()

	def filtered_heatmap_data_for_timeslot(self, spark, timeslot):
		return self.aggregatedmodel.filter(col("colapsed_ts") == str(timeslot)).toJSON().map(lambda j: json.loads(j)).collect()

	def list_timeslots(self, spark):
		return self.timeslot_list

	def list_destinations(self, spark):
		return self.destination_list

	def get_ntop_destinations_by_avgdelay(self, spark, limit):
		return self.aggregatedmodel.groupBy('DestinationName').agg(avg('AVG_DelayInSecs').alias('AVG_DelayInSecs')).limit(int(limit)).sort(desc('AVG_DelayInSecs')).toJSON().map(lambda j: json.loads(j)).collect()

	def get_avg_delay_per_day(self, spark, start_ts, end_ts):
		return self.aggregatedmodel.select("colapsed_ts", "AVG_DelayInSecs").filter((col("colapsed_ts") >= start_ts) & (col("colapsed_ts") <= end_ts)).groupBy("colapsed_ts").agg(avg('AVG_DelayInSecs').alias('AVG_DelayInSecs')).sort(asc('colapsed_ts')).toJSON().map(lambda j: json.loads(j)).collect()

	def get_recount_and_avgdelay(self, spark, ratio=1.0):
		return self.aggregatedmodel.sample(ratio).select("RecCount", "AVG_DelayInSecs").toJSON().map(lambda j: json.loads(j)).collect()