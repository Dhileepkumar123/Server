const Joi = require("joi");

const employeeClaimschema = {
  emp_id: Joi.number().required().label("Invalid Employee ID"),
  projectidfk: Joi.number().required().label("Invalid Project Name"),
  emp_name: Joi.number().required().label("Invalid Employee Name"),
  emp_deptid: Joi.number().required().label("Invalid Employee Department"),
  emp_desid: Joi.number().required().label("Invalid Employee Designation"),
  type: Joi.number().required().label("Invalid Employee Type"),
  activity: Joi.number().required().label("Invalid Activity"),
  start_date: Joi.date().required().label("Invalid Start Date"),
  end_date: Joi.date().required().label("Invalid End Date"),
  state_id: Joi.number().required().label("Invalid State Name"),
  district_id: Joi.number().required().label("Invalid District Name")
};

const updateemployeeclaimData = {
  id: Joi.number().integer().required().label("ID Required")
};

module.exports.employeeclaimDataSchema = Joi.object()
  .keys(employeeClaimschema)
  .options({ stripUnknown: true });

module.exports.editemployeeclaimDataSchema = Joi.object()
  .keys(employeeClaimschema, updateemployeeclaimData)
  .options({ stripUnknown: true });