
# NYC MTA Bus Delay Web Application

**Author**: Alexandre Juma, Alexandre Mendes, Celso Teixeira
**Date**: 05/06/2020

## How to run

`$ git clone https://github.com/afcms1111-iscteiul/VBD_DockerProject.git`

`$ cd VBD_DockerProject/ProjetoDeTransportes/`

`$ docker-compose up –build`

Access http://127.0.0.1:5000/ in your browser.

> Please note that the demo includes a simple 10.000 record raw-data sample. If you want to test with the full raw data-set, please download from https://www.kaggle.com/stoney71/new-york-city-transport-statistics/data?select=mta_1706.csv and replace the `mta_1706_sample.csv` file in the directory `./VBD_DockerProject/ProjetoDeTransportes/datasource` with the big file. To avoid reconfiguration, please maintain the file name with `mta_1706_sample.csv`

## Environment
This project has been tested with:

 1. Docker community (19.03.10-3)
 2. Linux x86_64 (3.10.0-1127.el7.x86_64)

The physical environment: 
 1. 4/8 Pysical/Logical Cores (Intel(R) Core(TM) i7-8550U CPU @ 1.80GHz)
 2. 16GB of RAM
 3. 512GB SSD Drive.

## Baseline running times

 1. Build docker image from scratch: ~2m (including fetches) 
 2. Run already built docker image: ~5s 
 3. Compute and cache the aggregated model with full raw data:~10m

## So what does this do?

![alt text](https://github.com/alexandrejuma/VBD_DockerProject/blob/master/front_page.PNG "Front page of the application")

You can plot:
 1. A horizontal bar chart depicting the TopN stops with higher average delay. 
 2. A Time-series depicting average delay per hour of day in the entire Bus Network.
 3. Ccatterplot depicting the correlation between the average delay of the aggregated data point and the count of aggregated records that contributed to it
 
 Additionally, you have an interactive geographic heatmap time-lapse of the Bus delays in New York City over the course of 1 month in 1-hour slides. There’s a Pause/Play button to control the time-lapse. There’s also a check box to enable/disable the custom markers where on-hover additional details about the original data points used to compute the heatmap density model. These tooltips are triggered on-hover.
 
 ![alt text](https://github.com/alexandrejuma/VBD_DockerProject/blob/master/geo_timelapse.PNG "Geo Timelapse of Bus delays")
