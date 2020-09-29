"""
Spark init operations
"""

from pyspark.sql import SparkSession

def init_spark_session(name): 	
	
	# start Spark session 
	spark = SparkSession.builder \
		.appName(name) \
		.master('local[*]') \
		.getOrCreate()

	return spark

def stop_spark_session(spark):
    	
	spark.stop()
