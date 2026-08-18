import Joi from 'joi';

// Local input validation only — this mirrors the documented IDGate360
// request shapes so bad requests fail fast (400) before we spend a call
// against the upstream API / wallet balance.

const nin = Joi.string().pattern(/^\d{11}$/).required()
    .messages({ 'string.pattern.base': 'nin must be exactly 11 digits' });

const bvn = Joi.string().pattern(/^\d{11}$/).required()
    .messages({ 'string.pattern.base': 'bvn must be exactly 11 digits' });

const phone = Joi.string().pattern(/^\d{11}$/).required()
    .messages({ 'string.pattern.base': 'phone must be an 11-digit number e.g. 08012345678' });

export const schemas = {
    ninPremium: Joi.object({ nin }),

    ninPhonePremium: Joi.object({ phone }),

    ninDemo: Joi.object({
        firstname: Joi.string().min(1).max(100).required(),
        lastname: Joi.string().min(1).max(100).required(),
        dob: Joi.string().pattern(/^\d{2}-\d{2}-\d{4}$/).required()
            .messages({ 'string.pattern.base': 'dob must be in DD-MM-YYYY format' }),
        gender: Joi.string().valid('m', 'f', 'male', 'female').required()
    }),

    bvnPremium: Joi.object({ bvn }),

    bankVerify: Joi.object({
        bvn,
        bankCode: Joi.string().min(1).max(20).required(),
        bankAccount: Joi.string().pattern(/^\d{10}$/).required()
            .messages({ 'string.pattern.base': 'bankAccount must be a 10-digit NUBAN number' })
    }),

    ipeSubmit: Joi.object({
        trackingID: Joi.string().alphanum().max(20).required()
    }),

    ipeStatus: Joi.object({
        trackingID: Joi.string().max(20).required()
    }),

    ninValidate: Joi.object({
        nin,
        validation_type: Joi.string().valid('no_record_found').optional()
    }),

    ninValidateStatus: Joi.object({
        transaction_id: Joi.string().optional(),
        nin: Joi.string().pattern(/^\d{11}$/).optional()
    }).or('transaction_id', 'nin')
        .messages({ 'object.missing': 'either transaction_id or nin is required' })
};

export const validateBody = (schemaName) => (req, res, next) => {
    const schema = schemas[schemaName];
    const { error, value } = schema.validate(req.body, { abortEarly: true, stripUnknown: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message
        });
    }
    req.body = value;
    next();
};
