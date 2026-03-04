# future imports
from __future__ import absolute_import
from __future__ import unicode_literals

import socket, struct, time, platform, random
import json
from urllib.parse import quote
import requests
from urllib.parse import urlencode


# base url for all requests
BASE_URL = 'https://dweet.cc'

class DweepyError(Exception):
    pass

def _request(method, url, session=None, **kwargs):
    """Make HTTP request, raising an exception if it fails.
    """
    url = BASE_URL + url

    if session:
        request_func = getattr(session, method)
    else:
        request_func = getattr(requests, method)
    response = request_func(url, **kwargs)
    # raise an exception if request is not successful
    if not response.status_code == requests.codes.ok:
        raise DweepyError('HTTP {0} response'.format(response.status_code))
    response_json = response.json()
    if response_json['this'] == 'failed':
        raise DweepyError(response_json['because'])
    return response_json['with']

def _send_dweet(payload, url, params=None, session=None):
 
    data = json.dumps(payload)
    headers = {'Content-type': 'application/json'}
    return _request('get', url, params=payload, session=session)

def dweet_for(thing_name, payload, key=None, session=None):
    if key is not None:
        params = {'key': key}
    else:
        params = None
    return _send_dweet(payload, '/dweet/for/{0}'.format(thing_name), params=params, session=session)

def get_latest_dweet_for(thing_name, key=None, session=None):
    """Read the latest dweet for a dweeter
    """
    if key is not None:
        params = {'key': key}
    else:
        params = None
    return _request('get', '/get/latest/dweet/for/{0}'.format(thing_name), params=params, session=session)

def get_dweets_for(thing_name, key=None, session=None):
    """Read all the dweets for a dweeter
    """
    if key is not None:
        params = {'key': key}
    else:
        params = None
    return _request('get', '/get/dweets/for/{0}'.format(thing_name), params=params, session=None)

def getTemp():
    return random.randint(1,1000)
    
def getHumidity():
    return 10
    
def getOS():
    return platform.platform()
    
def post(dic):
    thing = 'therapeutic-caption'
    print(dweet_for(thing, dic))
    
def getReadings():
    dict = {}
    dict["temperature"] = getTemp();
    dict["humidity"] = getHumidity();
    return dict

while True:
    dict = getReadings();
    post(dict)
    time.sleep(5)
    