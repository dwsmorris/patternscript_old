import _ from "lodash/fp";

var script2lines = script => script.split("\n");
var trim = line => line.trim();
var line2sexp = line => (line && (line[0] !== "(")) ? "(set " + line + ")" : line;
var sexp2spaced = line => line.replace(/\(/g, " ( ").replace(/\)/g, " ) ");
var spaced2tokens = line => line.split(/\s+/).slice(2, -2); // outer brackets
var evaluateToken = token => {
	if (token === "true") return true;
	else if (token === "false") return false;
	else return isNaN(token) ? token : +token; 
};
var tokens2ast = tokens => {
	var ast = [];

	while (tokens.length) {
		var token = tokens.shift();

		if (token === "(") ast.push(tokens2ast(tokens));
		else if (token === ")") return ast;
		else ast.push(token);
	}

	return ast;
};
var set = function(name, operator, expression) {
	this[name] = evaluate(expression);
} 
var rootEnvironment = () => ({
	console: console,
	set: set,
	".": function(object, property) {
		return this[object][property];
	}
});

var script = 
`log <= (. console log)
(log 3)
`

var output = script2lines(script).map(_.flow(trim, line2sexp, sexp2spaced, spaced2tokens, _.map(evaluateToken), tokens2ast));
var environment = rootEnvironment();
var evaluate = function(sexp) {
	if (!sexp.length) return;

	return environment[sexp[0]].apply(environment, sexp.slice(1));
};
_.each(evaluate, output);

console.log(JSON.stringify(output));