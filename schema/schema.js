const { body, validationResult, param } = require("express-validator");
const Joi = require('joi');
let gstValid = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$";
let vechicleno = "^[A-Z]{2}{0, 1}[0-9]{2}{0, 1}[A-Z]{1, 2}{0, 1}[0-9]{4}$";

module.exports.districtsschema = [
        body('district_name').exists().not().isEmpty().isString(),
        body('state_id').exists().not().isEmpty().isInt(),
];

// vehicle schema
module.exports.vehicleschema = Joi.object().keys({
        regNo: Joi.string().regex(/^[a-zA-Z]{2}[0-9]{2}[a-zA-Z]{1,2}[0-9]{4}$/).required().label("Invalid Vehicle Number"),
        engNo: Joi.string().required(),
        //  dept: Joi.number().integer().required(),
        // chasNo: Joi.string().required(),
        // model: Joi.string().required(),
        // regdate:Joi.date().required(),
        // companyname:Joi.number().integer().optional(),
        // fuelcardid:Joi.number().integer().optional(),
        // insurance_exp_date:Joi.date().optional(),
        // fc_exp_date:Joi.date().optional(),
        // pollution_exp_date:Joi.date().optional(),
        // circle_name:Joi.number().integer().required(),
        // cluster:Joi.number().integer().required(),
        // remark: Joi.string().optional(),
}).options({ stripUnknown: true });

module.exports.validate = (req, res, next) => {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
                return next()
        }
        const extractedErrors = []
        errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }))
        console.log('Error', errors, extractedErrors);
        return res.status(422).json({
                errors: extractedErrors,
        })
}

module.exports.Vehicleactivedate = [
        // body('year(vtr.date)').exists().not().isEmpty().isISO8601(),
        // body('year').exists().not().isEmpty().isISO8601(),
        // body('MONTH(vtr.date)').exists().not().isEmpty().isISO8601(),
        // body('mm').exists().not().isEmpty().isISO8601(),
        body('date').exists().not().isEmpty().isISO8601()
];

module.exports.vendorcatschema = [
        body('category_name').exists().not().isEmpty().isString(),
        body('category_code').exists().not().isEmpty().isString(),
        // body('description').exists().not().isEmpty().isString(),
        body('processtype').exists().not().isEmpty().isInt(),
];

module.exports.customerposchema = [
        body('client_id').exists().not().isEmpty().isString(),
        body('Circle_id').exists().not().isEmpty().isString(),
        body('customer_po_no').exists().not().isEmpty().isString(),
        body('type_id_fk').exists().not().isEmpty().isString(),
        body('po_netvalue').exists().not().isEmpty().isString(),
        body('po_grossvalue').exists().not().isEmpty().isString(),
        body('po_date').exists().not().isEmpty().isISO8601(),
        body('po_validity_from').exists().not().isEmpty().isISO8601(),
        body('po_validity_to').exists().not().isEmpty().isISO8601(),
        body('description').exists().not().isEmpty().isString(),
        body('communication').exists().not().isEmpty().isString(),
        body('po_file_name').exists().not().isEmpty().isString(),
];

module.exports.vendorschema = [
        body('processtype').exists().not().isEmpty().isInt(),
        body('vendorname').exists().not().isEmpty().isString(),
        body('contactpersonname').exists().not().isEmpty().isString(),
        body('category').exists().not().isEmpty().isInt(),
        body('emailid').exists().not().isEmpty().isEmail(),
        body('mobile').exists().not().isEmpty().isString(),
        body('billingaddress').exists().not().isEmpty().isString(),
        body('state').exists().not().isEmpty().isInt(),
        body('city').exists().not().isEmpty().isInt(),
        body('country_name').exists().not().isEmpty().isInt(),
];

module.exports.vehicletypeschema = [
        body('vehicletype').exists().not().isEmpty().isString(),
];

/*vehicle service 
module.exports.vservice=Joi.object().keys({
        vehicleno:Joi.number().integer().required(),
        vsdate:Joi.date().required(),
        invdate:Joi.date().required(),
        invoiceno:Joi.number().integer().required(),
        invoamt:Joi.number().integer().required(),
        cluster:,
        circle_name:,
        servtype:Joi.number().integer().required(),
        drivenkms:Joi.number().integer().required(),
        paymdate:Joi.date().required(),
        paymamt:Joi.number().integer().required(),
        utrno:,
        paymto:Joi.string().required(),
        billstatus:Joi.number().integer().required(),
        billrecdate:Joi.date().required(),
        claimamt:Joi.number().integer().required(),
        claimrecdate:Joi.date().required(),
        acc_no:Joi.string().regex(/^[0-9]{9,18}$/).optional().label("Invalid account number"),
        ifsc_code:Joi.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional().label("ifsc invalid"),
        servremark:Joi.string().optional(),
        srvc:Joi.string().optional(),
        empid:Joi.number().integer().optional()

}).options({ stripUnknown: true});*/

module.exports.serviceposchema = [
        body('vendor_name').exists().not().isEmpty().isString(),
        body('service_indent_id').exists().not().isEmpty().isInt(),
        body('vendor_id,').exists().not().isEmpty().isInt(),
        body('contact_person_name').exists().not().isEmpty().isString(),
        body('email').exists().not().isEmpty().isEmail(),
        body('mobile').exists().not().isEmpty().isString(),
        body('gst_no').exists().not().isEmpty().isString(),
        body('pan_no').exists().not().isEmpty().isString(),
        body('period_enddate').exists().not().isEmpty().isDate(),
        body('ship_address').exists().not().isEmpty().isString(),
        body('grand_count').exists().not().isEmpty().isString(),
        body('ship_address').exists().not().isEmpty().isString(),
];

module.exports.vendorposchema = [
        body('process_type').exists().not().isEmpty().isInt(),
        body('expensetype').exists().not().isEmpty().isInt(),
        // body('nfa').exists().not().isEmpty().isInt(),
        body('customer').exists().not().isEmpty().isInt(),
        body('service_catg').exists().not().isEmpty().isInt(),
        body('circle_name').exists().not().isEmpty().isInt(),
        body('cluster').exists().not().isEmpty().isInt(),
        body('cc_email').exists().not().isEmpty().isEmail(),
        body('vendor_name').exists().not().isEmpty().isInt(),
        body('GST_NO').exists().not().isEmpty().isString(),
        body('address').exists().not().isEmpty().isString(),
        body('vendor_email').exists().not().isEmpty().isEmail(),
        body('buyer').exists().not().isEmpty().isInt(),
        body('pay_terms').exists().not().isEmpty().isInt(),
        body('tax_type').exists().not().isEmpty().isInt(),
        body('calc_type').exists().not().isEmpty().isInt(),
];

// module.exports.frtroom = [
//         body('ownername').exists().not().isEmpty().isString(),
//         body('rentaddress').exists().not().isEmpty().isString(),
//         // body('nfa').exists().not().isEmpty().isInt(),
//         body('rentamount').exists().not().isEmpty().isInt(),
//         body('holdingStatus').exists().not().isEmpty().isInt(),
//         body('remarks').exists().not().isEmpty().isString(),        
// ];

// module.exports.servicevendorposchema = [
//         body('beneficiary_name').exists().not().isEmpty().isString(),
//         body('account_no').exists().not().isEmpty().isString(),
//         body('nfa').exists().not().isEmpty().isInt(),
//         body('bank_name').exists().not().isEmpty().isString(),
//         body('bank_branch').exists().not().isEmpty().isString(),
//         body('ifsc_no').exists().not().isEmpty().isString(),
//         body('invoice_no').exists().not().isEmpty().isString(),
//         body('invoicereceived_date').exists().not().isEmpty().isISO8601(),
//         body('expensetype').exists().not().isEmpty().isInt(),
//         body('service_startdate').exists().not().isEmpty().isISO8601(),
//         body('service_enddate').exists().not().isEmpty().isISO8601(),
//         body('invoice_cat').exists().not().isEmpty().isString(),
//         body('gst_status').exists().not().isEmpty().isString(),
//         body('remarks').exists().not().isEmpty().isString(),
//         body('tax_type').exists().not().isEmpty().isInt(),
//         body('reg_bank').exists().not().isEmpty().isInt(),
//         body('invoice_remarks').exists().not().isEmpty().isString(),
//         body('invoice_copy').exists().not().isEmpty().isString(),
//         body('pay_type').exists().not().isEmpty().isInt(),
//         body('payment_date').exists().not().isEmpty().isISO8601(),
//         body('advance_amt').exists().not().isEmpty().isInt(),
//         body('payment_remarks').exists().not().isEmpty().isString(),
//         body('utr_no').exists().not().isEmpty().isString(),
//         body('receivedby').exists().not().isEmpty().isString(),
//         body('received_date').exists().not().isEmpty().isISO8601(),
//         body('handoverby').exists().not().isEmpty().isString(),
//         body('handover_date').exists().not().isEmpty().isISO8601(),
// ];

module.exports.expensetypeschema = [
        body('expensetype_name').exists().not().isEmpty().isString(),
];

module.exports.paymenttermschema = [
        body('paymonths').exists().not().isEmpty().isString(),
];

// module.exports.employeeadd=Joi.object().keys({
//         employee_id:Joi.number().integer().required(),
//         fst_name:Joi.string().required(),
//         emp_type:Joi.number().integer().required(),
//         state:Joi.number().integer().required(),
//         mobile_no:Joi.number().integer().min(10 ** 9).max(10 ** 10 - 1).required(),
//         email_id:Joi.string().email().required(),
//         pan_no:Joi.number().integer().min(10 ** 9).max(10 ** 10 - 1).required(),
//         lst_name:Joi.string().required(),
//         client:Joi.number().integer().allow('', null).optional(),
//         projectname:Joi.number().integer().allow('', null).optional(),
//         role:Joi.number().integer().allow('', null).optional(),
//         sub_emp:Joi.number().integer().allow('', null).optional(),
//         birth:Joi.number().integer().allow('', null).optional(),

// }).options({ stripUnknown: true });

module.exports.subemptypeschema = Joi.object().keys({
        subempayname: Joi.string().required(),
}).options({ stripUnknown: true });

module.exports.editsubemptypeschema = Joi.object().keys({
        subempayname: Joi.string().required(),
        subemp_id: Joi.number().integer().required()
}).options({ stripUnknown: true });

module.exports.BuyerDetailsschema = Joi.object().keys({
        buyer_name: Joi.string().required(),
        cmpnyname: Joi.string().required(),
        regisaddress: Joi.string().required(),
        shipmentaddress: Joi.string().required(),
        panno: Joi.string().pattern(/[A-Z]{5}[0-9]{4}[A-Z]{1}/).allow('', null),
        state_id: Joi.number().integer().required(),
        gstno: Joi.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).required().label("Invalid GST Number")
}).options({ stripUnknown: true });

module.exports.claim_typeschema = Joi.object().keys({
        claimname: Joi.string().required(),
        paytype_id: Joi.number().integer().required()
}).options({ stripUnknown: true });

module.exports.clientsschema = Joi.object().keys({
        client_name: Joi.string().required(),
        client_code: Joi.string().required(),
        vmx_ven_code: Joi.string().required()
}).options({ stripUnknown: true });

module.exports.meptschema = [
        body('meptname').exists().not().isEmpty().isString(),
        body('name').exists().not().isEmpty().isInt(),
];

// module.exports.employeesschema = [
//         body('employee_id').exists().not().isEmpty().isString(),
//         body('fst_name').exists().not().isEmpty().isString(),
//         body('emp_type').exists().not().isEmpty().isInt(),
//         body('state').exists().not().isEmpty().isInt(),
//         body('client').exists().not().isEmpty().isInt(),
//         body('project_name').exists().not().isEmpty().isString(),
//         body('mobile_no').exists().not().isEmpty().isString(),
//         body('email_id').exists().not().isEmpty().isEmail(),
//         body('pan_no').exists().not().isEmpty().isString(),
// ];

// module.exports.employeeclaimschema = [
//         body('claim_type_id').exists().not().isEmpty().isInt(),
//         body('payment_type').exists().not().isEmpty().isInt(),
//         body('circle_name').exists().not().isEmpty().isInt(),
//         body('cluster').exists().not().isEmpty().isInt(),
//         body('project').exists().not().isEmpty().isInt(),
//         body('service_catg').exists().not().isEmpty().isInt(),
//         body('employee_name').exists().not().isEmpty().isInt(),
//         body('claim_amount').exists().not().isEmpty().isCurrency(),
//         body('claim_entry_date').exists().not().isEmpty().isISO8601(),
//         body('claim_rcv_date').exists().not().isEmpty().isISO8601(),
//         body('claim_entry_by').exists().not().isEmpty().isString(),
//         body('bill_period_from').exists().not().isEmpty().isISO8601(),
//         body('bill_period_to').exists().not().isEmpty().isISO8601(),
//         body('remarks').exists().not().isEmpty().isLength(),
//         body('approved_by').exists().not().isEmpty().isString(),
//         body('payment_amount').exists().not().isEmpty().isCurrency(),
//         body('payment_date').exists().not().isEmpty().isISO8601(),
//         body('payment_entry_date').exists().not().isEmpty().isISO8601(),
//         body('payment_entry_by').exists().not().isEmpty().isString(),
//         body('utr_no').exists().not().isEmpty().isString(),
// ];

// const { body, validationResult, param } = require("express-validator");
// const Joi = require('joi');

// module.exports.vehicletrackschema = Joi.object().keys({
// })

// project: Joi.string().required().label('Project is Required'),
// regNo: Joi.number().integer().label('Registration is Required'),
// opening_km: Joi.integer().label('Opening km is Required'),
// companyname: Joi.string().label('Companyname is Required'),
// circle_name: Joi.string().label('Circle Name is Required'),
// cluster: Joi.string().label('Cluster is Required'),
// jcname: Joi.string().label('Jcname is Required'),
// activity: Joi.string().label('Activity is Required')