import _ from "lodash/fp";

var script2lines = script => script.split("\n");
var stripComments = line => {
	var commentIndex = line.indexOf("//");

	return (commentIndex === -1) ? line : line.slice(0, commentIndex);
};
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
		else ast.push(evaluateToken(token));
	}

	return ast;
};
var rootEnvironment = () => ({
	console: console,
	set: function(name, operator, expression) {
		var result = evaluate(expression);

		if (operator === "<=") {
			this[name] = result;
		} else if (operator === "=>") {
			if (_.isArray(result) && (expression === result)) this[name] = expression;
			else this[name] = function() {return result;};
		}
	},
	"+": function() {var result = _.curry(function(a, b) {return a + b;}); result.arity = 2; return result;}(),
	".": function(object, property) {
		var object = this[object];
		var value = object[property];

		return _.isFunction(value) ? value.bind(object) : value;
	}
});

var script = 
`log <= (. console log)
(log 1) // 1

two => 2
(log (two)) // 2

(log (+ 1 2)) // 3

addTwo => (+ 2)
(log (addTwo 2)) // 4

// (log ((+ 2) 3)) // 5

// add => (+)
// addOne => (add 1)
// (log (addOne 5)) // 6
`

var output = script2lines(script).map(_.flow(trim, stripComments, line2sexp, sexp2spaced, spaced2tokens, _.map(evaluateToken), tokens2ast));
var environment = rootEnvironment();
var evaluate = function(sexp) {
	if (!_.isArray(sexp) || !sexp.length) return sexp;

	var fn = environment[sexp[0]];
	var parameters = sexp.slice(1);
	
	if (_.isArray(fn)) return evaluate(fn.concat(parameters))
	else {
		var requiredParameters = fn.arity ? fn.arity : fn.length;
		return (parameters.length >= requiredParameters) ? fn.apply(environment, _.map(evaluate, parameters)) : sexp;
	}
};
_.each(evaluate, output);

console.log(JSON.stringify(output));