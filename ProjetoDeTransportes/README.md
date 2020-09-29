
# BIG DATA VISUALIZATION
### 2019-20
### Adriano Lopes

# Introduction

This is a Docker web app project template

# Pre-requirements

Docker is running e.g. via Docker Desktop

# Running

We are using docker-compose. Right now, there is just one service.
But if more are added, e.g. Spark on itself or a database, the we have 
the template already in place

### Make sure docker is running

`$ docker --version`
   
### Create and start containers 
(according to yml specification given - if not, docker-compose.yml would be located in the same directory)

`$ docker-compose up`

    or, if you want to build as well

`$ docker-compose up --build`

See [Docker Compose getting started](https://docs.docker.com/compose/gettingstarted/)

# Other Docker related options
 (some need more checking and adjustment)

### Check what containers are running

`$ docker ps`

### Stop a container

`$ docker stop <container ID>`

### Having a bash shell to run arbitrary commands inside the container

`$ docker exec -it <container ID> bash`

( to leave the bash use `$ exit` )

### Copy local files to the container

`$ docker cp <local files> <container ID>:<target dir>`

### Build the image

`$ docker build -t flaskapp app`

### Run the image

`$ docker run -it -p 5000:5000 BDVapp` 

### Deploy the image

You can deploy your container if, for instance, you have signed for an account at [Docker Hub](https://hub.docker.com/). Check for instructions there

(image running: bdvapp_webapp)

# Resources

## Spark

Since pyspark is available directly via Python's pip, we can avoid setting up a service on its own. As of April 2020, the code is 

    spark-2.4.5-bin-hadoop2.7.tgz

## Visual Studio Code

[Working with containers](https://code.visualstudio.com/docs/containers/overview)
