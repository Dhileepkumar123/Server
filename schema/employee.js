const Joi = require('joi');

//---Employee Schema---//
const employeeSchema = {
    employee_id: Joi.string().required().label("Invalid Employee ID"),
    // role: Joi.number().required().label("Invalid Role ID"),
    usercode: Joi.string().required().label("Invalid UserCode"),
    username: Joi.string().alphanum().min(3).max(30).required().label("Invalid UserName"),
    usr_password: Joi.string().min(4).required().label("Invalid Password"),
    fst_name: Joi.string().required().label("Invalid First Name"),
    lst_name: Joi.string().required().label("Invalid Last Name"),
    emp_type: Joi.number().required().label("Invalid Employee Type"),
    emp_deptid: Joi.number().required().label("Invalid Department Name"),
    emp_desid: Joi.number().required().label("Invalid Designation Name"),
    work_exp: Joi.number().required().label("Invalid Work Experience Type"),
    // experienc_yrs: Joi.number().required().label("Invalid Year of Experience"),
    projectname: Joi.number().required().label("Invalid Project Name"),
    logintype: Joi.number().required().label("Invalid Login Type"),
    state: Joi.number().required().label("Invalid State Name"),
    district: Joi.number().required().label("Invalid District Name"),    
    employeerole: Joi.number().required().label("Invalid Employee Role Name"),    
    // sub_emp: Joi.number().required().label("Invalid Sub Employee Type"),
    logintype: Joi.number().required().label("Invalid Login Type"),
    birth: Joi.date().required().label("Invalid Date of Birth"),
    joining: Joi.date().required().label("Invalid Date of Joining"),
    mobile_no: Joi.string().max(10, 'utf8').required().label("Invalid Mobile Number"),
    email_id: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required().label("Invalid Email_ID"),
    emergency_no: Joi.number().required().label("Invalid Emergency Number"),
    present_addr: Joi.string().required().label("Invalid Present Address"),
    permanent_addr: Joi.string().required().label("Invalid Permanent Address"),
    // pan_no: Joi.string().regex("[A-Z]{5}[0-9]{4}[A-Z]{1}").required().label("Invalid Pan Number"),
    pan_no: Joi.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required().label("Invalid Pan Number"),
    // '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    gst_no: Joi.string().regex(/\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}/).required().label("Invalid Gst Number"),
    // gst_no: Joi.string().regex(/\^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().label("Invalid Gst Number"),    
    bank_name: Joi.string().required().label("Invalid Bank Name"),
    acnt_name: Joi.string().required().label("Invalid Account Name"),
    acnt_no: Joi.number().required().label("Invalid Account Number"),
    bank_branch: Joi.string().required().label("Invalid Branch Address"),
    ifsc_no: Joi.string().required().label("Invalid Ifsc Number"),
    micf_code: Joi.string().required().label("Invalid Micf Code"),
    other_acnt_name: Joi.string().required().label("Invalid Other Bank Name"),
    otherbnk_acnt_no: Joi.number().required().label("Invalid Other Bank Account Number"),
    otherbank_addr: Joi.string().required().label("Invalid Other Bank Address"),
    other_ifsc_no: Joi.string().required().label("Invalid Other Ifsc Number")
    // fst_name: Joi.number().required().label("Invalid Employee Name"),
}

const updateemployeeData = { id: Joi.number().required().label("ID Required") };

module.exports.employeeDataSchema = Joi.object().keys(
    employeeSchema
).options({ stripUnknown: true });

module.exports.editemployeeDataSchema = Joi.object().keys(employeeSchema, updateemployeeData).options({ stripUnknown: true });
////-------------------------------------------------------------------------------------------////

//---Department Schema---////
const departmentschema = {
    emp_department: Joi.string().required().label('Department is Required')    
}

const updatedepartmentData = { id: Joi.number().required().label("ID Required") };

module.exports.departmentDataSchema = Joi.object().keys(
    departmentschema
).options({ stripUnknown: true });

module.exports.editdepartmentDataSchema = Joi.object().keys(departmentschema, updatedepartmentData).options({ stripUnknown: true });
////-------------------------------------------------------------------------------////

//---Designation Schema---////
const designationschema = {
    emp_deptid: Joi.number().required().label("Invalid Department ID"),
    emp_designation: Joi.string().required().label("Invalid Designation Name")
}

const updatedesignationData = { id: Joi.number().required().label("ID Required") };

module.exports.designationDataSchema = Joi.object().keys(
    designationschema
).options({ stripUnknown: true });

module.exports.editdesignationDataSchema = Joi.object().keys(designationschema, updatedesignationData).options({ stripUnknown: true });
////-------------------------------------------------------------------------------////