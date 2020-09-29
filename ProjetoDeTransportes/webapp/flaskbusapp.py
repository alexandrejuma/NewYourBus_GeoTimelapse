"""
App: Bus
"""

from flask import Flask, request, render_template, jsonify
import json
import os
import logging

# importing own code 
from spark.spark import init_spark_session, stop_spark_session
from spark.model.mtabus import MTABusModel

# sort of print
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# variables to hold/control information
datasource = os.path.abspath(os.path.dirname(__file__)) + "/datasource/mta_1706_sample.csv"
record_limit = 2500000
logger.info(" Raw data filename will be: " + datasource)
logger.info("Dataset raw data limited to " + str(record_limit) + " records!")
spark = init_spark_session("BDVapp")
modelo = None

app = Flask(__name__)

# set routes to control the app

# TODO: Beautify front page

def check_model():
    global modelo
    if modelo is None:
        logger.info("modelo is null. recomputing.")
        modelo = MTABusModel(spark, datasource, record_limit)

    return modelo

@app.route('/', methods=['GET'])
def home():
    logger.info(" ROUTE: / => Home")
    return render_template('home.html',
                            title='Big Data Visualization',
                            template='home-template'
                        )

@app.route('/geovisualization', methods=['GET'])
def model():
    logger.info(" ROUTE: /geovisualization => Geovisualization")
    
    modelo = check_model();
    
    full_heatmap_data = modelo.full_heatmap_data(spark)

    return render_template('bus/busGeoVisualization.html',
                            title='Big Data Visualization',
                            data=full_heatmap_data,
                            template='geovisualization-template'
                        )

@app.route('/geovisualization/<timeslot>', methods=['GET'])
def geomodelts(timeslot):

    logger.info(" ROUTE: /geovisualization => Geovisualization")

    modelo = check_model();

    heatmap_ts = modelo.filtered_heatmap_data_for_timeslot(spark, timeslot)

    return render_template('bus/busGeoVisualization.html',
                            title='Big Data Visualization',
                            data=heatmap_ts,
                            template='geovisualization-template'
                        )

@app.route('/scatterplot/<sample_ratio>', methods=['GET'])
def scatterplot(sample_ratio):
    logger.info(" ROUTE: /scatterplot => Some graphics")
    modelo = check_model();

    scat_data = modelo.get_recount_and_avgdelay(spark, float(sample_ratio))

    return render_template('bus/busScatterPlot.html',
                            title='Big Data Visualization',
                            data=scat_data,
                            template='geovisualization-template'
                        )

@app.route('/mod', methods=['GET'])
def basemodel():
   
    logger.info(" ROUTE: /mod => Create model")
    global spark, datasource, modelo
    
    if modelo is None:
        logger.info("modelo is null. recomputing.")
        modelo = MTABusModel(spark, datasource, record_limit)
    else:
        logger.info("modelo not null")

    return render_template('bus/basemodel.html',
                            title='Big Data Visualization',
                            template='model-template')

@app.route('/viz1_hbarchart/<limit>', methods=['GET'])
def hbarchart(limit):
    logger.info(" ROUTE: /viz1_hbarchart => Some graphics")

    modelo = check_model();

    viz1_hbarchart_ntop_avg_delay = modelo.get_ntop_destinations_by_avgdelay(spark, limit)
    return render_template('bus/hbar.html', 
                    title='Big Data Visualization',
                    viz1data=viz1_hbarchart_ntop_avg_delay,
                    template='vismodel-template')

@app.route('/viz1_timeseries/<start_ts>/<end_ts>', methods=['GET'])
def timeserieschart(start_ts, end_ts):
    logger.info(" ROUTE: /viz1_timeseries/<start_ts>/<end_ts> => Some graphics")

    modelo = check_model();

    viz1_ts_data = modelo.get_avg_delay_per_day(spark, start_ts, end_ts)
    return render_template('bus/timeseries.html', 
                            title='Big Data Visualization',
                            viz1data=viz1_ts_data,
                            template='vismodel-template')

@app.route('/data/heatmap/<timeslot>', methods=['GET'])
def get_heatmap_timeslot(timeslot):
    global spark, modelo
    if modelo is None:
        return "{}"
    else:
        res = modelo.filtered_heatmap_data_for_timeslot(spark, timeslot)
        return json.dumps(res)

@app.route('/data/heatmap/destination/<destination>', methods=['GET'])
def get_heatmap_for_destination(destination):
    global spark, modelo
    if modelo is None:
        return "{}"
    else:
        res = modelo.filtered_heatmap_data_for_destination(spark, destination)
        return json.dumps(res)

@app.route('/data/heatmap/list_timeslots', methods=['GET'])
def get_heatmap_timeslot_list():
    global spark, modelo
    if modelo is None:
        return "{}"
    else:
        res = modelo.list_timeslots(spark)
        return json.dumps(res)

@app.route('/data/heatmap/list_destinations', methods=['GET'])
def get_heatmap_destination_list():
    global spark, modelo
    if modelo is None:
        return "{}"
    else:
        res = modelo.list_destinations(spark)
        return json.dumps(res)

@app.route('/about', methods=['GET'])
def about():
    logger.info(" ROUTE: /about => About")
    return render_template('about.html',
                            title='Big Data Visualization',
                            template='about-template'
                        )
   
# run the app
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)



########################################################
# ROUTES AND HTML TEMPLATES SO FAR
#
#	/							home.html	
#	/about						about.html
#	/mod						bus/basemodel.html		
#	/viz1_timeseries/<start_ts>/<end_ts>	bus/timeseries.html
#	/viz1_hbarchart/<limit>		bus/hbar.html
#	/scatterplot/<sample_ratio>	bus/busScatterPlot.html
#	/geovisualization/			bus/busGeoVisualization.html
#	/geovisualization/<timeslot>	bus/busGeoVisualization.html

########################################################
# DATA SERVICES (JSON Response Payload)
#
#	/data/heatmap/list_destinations
#	/data/heatmap/list_timeslots
#	/data/heatmap/destination/<destination>
#	/data/heatmap/<timeslot>

########################################################
# Some information
#
# render_template alows to separate presentation from controller
# it will render HTML pages
# notice Flask uses Jinja2 template engine for rendering templates
# url_for() to reference static resources. 
# For example, to refer to /static/js/main.js, 
# you can use url_for('static', filename='js/main.js')
# request is to hold requests from a client e.g request.headers.get('')
# URLs to be handled by the app route handler
