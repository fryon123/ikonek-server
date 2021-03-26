exports.isValid = function() {};
exports.haveSymbols = function(string) {
  console.log(string);
  if (string.match("^[a-zA-Z]+$")) return false;
  return true;
};
