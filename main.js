var _ = require("lodash/fp");

var script2lines = script => script.split("\n");
var trim = line => line.trim();
var line2sexp = line => (line && (line[0] !== "(")) ? "(set " + line + ")" : line;
var sexp2spaced = line => line.replace(/\(/g, " ( ").replace(/\)/g, " ) ");
var spaced2tokens = line => line.split(/\s+/).slice(2, -2); // outer brackets

var script = 
`log <= (. console log)
(log 3)
`

var output = script2lines(script).map(_.flow(trim, line2sexp, sexp2spaced, spaced2tokens));

console.log(JSON.stringify(output));