function checkRequirementsInput(req, res, routes) {
  if (
    req.body.task === "" ||
    req.body.spendAt === "" ||
    req.body.spend == "" ||
    req.body.info === ""
  ) {
    req.flash("errors", "please fill all fields");
    return res.redirect(routes);
  }
  return true;
}

module.exports = checkRequirementsInput;
