from flask import Flask, request, Response
from fuzzywuzzy import process, fuzz
import json
import string

app = Flask(__name__)

with open("data/count_1w.txt") as f:
    data = f.read().strip().split("\n")

default = list(map(lambda x: x.split("\t")[0], data[4]))

words = {}

for c in string.printable:
    words[c] = []

for w in data:
    words[w[0]].append(w.split("\t")[0])

with open("data/bigrams.mod") as f:
    data = list(map(lambda x: x.split("\t")[0].split(" "), f.read().strip().split("\n")))

bi = {}

for k,v in data:
    if k not in bi.keys():
        bi[k] = list()
    bi[k].append(v)

@app.route("/predict")
def index():
    current = request.args.get("current")
    past = request.args.get("past")

    try:
        if len(current) > 0:
            res = list(filter(lambda x: x.startswith(current),bi[past]))[:4]
        else:
            res = bi[past][:4]

    except:
        res = []

    if len(current) > 0:
        res += list(filter(lambda x: x.startswith(current), words[current[0]]))[:4]

    else:
        res += bi["<S>"][:4]

    res = list(set(res))

    for i in range(len(res),4):
        res.append("")

    return json.dumps(res[:4])
