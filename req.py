import sys
import requests
import json
from codetiming import Timer

url = 'http://127.0.0.1:55555/req?qid='

bPrint = True

if len(sys.argv) == 2:
    url = url + sys.argv[1]
elif len(sys.argv) == 3 and sys.argv[1] == 't':
    url = url + sys.argv[2]
    bPrint = False
else:
    print ("Usage: req [t] url")
    print ("set the first argument to t to only time (don't print the result)")
    quit()

#url = url + "MD_AGG&dim=property&gby=range(property:year_built;1600;50;2),prop_type&val=beds:count"
print ('Request string=', url)
with Timer() as t:
    try:
        resp = requests.get(url)
    except:
        print ("Request error")
        quit()

try:
    if bPrint:
        print(json.dumps(resp.json(), indent = 2)) 
except:
    print ("Parse JSON error")
    print(resp.text)
    quit()