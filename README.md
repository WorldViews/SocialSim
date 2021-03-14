# SocialSim
Javascript classes for simulation of social interactions

This repo has classes to help with simulations of social media use, emotional and cognitive contagion, various tools for understanding polarization and spread of ideologies, etc.

It is intended that these classes would be used either from ObservableHQ or GraphXR+grove notebooks, by node scripts running the simulations, or perhaps by other web pages.

Several basic servers are provided here.  The python servers are the simple builtin http server.  There is a script for port 80 and one for 8000.   There
is also a python server called corsServer.py, but for not it seems that is not
needed.

There is also a basic node server.  To run this, you will need to do

npm install

then launch the node servers on windows with runNodeServer80, or simply
run the command node js/server.py

As this project continues, most new features on the server side will probably be added to the node version.

## Testing in Browser

The basic Sim class has a method for running some tests.  (Currently nothing is really checked, but it can verify that things run through to completion, and the log output can be examined as crude reality check.)   Before systematic tests are created, we should get a pseudo random number generator that can be
seeded to produce reproducible tests.

The tests can be run by the testSim scripts in tests, or by bringing up the pages like testSim1.html.



