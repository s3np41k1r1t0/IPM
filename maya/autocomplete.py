from flask import Flask, request, Response
from fuzzywuzzy import process, fuzz
import json
import string

app = Flask(__name__)

with open("count_1w.txt") as f:
    data = f.read().strip().split("\n")
		
default = list(map(lambda x: x.split("\t")[0], data[4]))

words = {}

for c in string.printable:
    words[c] = []

for w in data:
    words[w[0]].append(w.split("\t")[0])

for c in string.printable:
    # good enough i guess
    words[c] = words[c][:100]

with open("spell-errors.txt") as f:
    data = f.read().strip().split("\n")

autocorrect = {}

for line in data:
	v = line.split(": ")[0].split(",")
	for k in line.split(": ")[1].split(", "):
		autocorrect[k] = v[0]
		
@app.route("/")
def index():
	current = request.args.get("current")

	if current == "":
		return Response(response={"words":default}, status=200, mimetype="application/json")

	try:
		res = []
		res.append(autocorrect[current])
		res += list(map(lambda x: x[0], process.extract(current, words[current[0]], limit=3, scorer=fuzz.token_sort_ratio)))
		return Response(response={"words":res}, status=200, mimetype="application/json")

	except: 
		res = list(map(lambda x: x[0], process.extract(current, words[current[0]], limit=4, scorer=fuzz.token_sort_ratio)))
		return Response(response={"words":res}, status=200, mimetype="application/json")

if __name__ == "__main__":
    app.run("0.0.0.0", 5000, debug=True)
