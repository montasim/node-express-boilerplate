import mongoose from 'mongoose';

import mongooseSchemaHelpers from '../../utils/mongooseSchemaHelpers.js';

const { Schema } = mongoose;

const roleSchema = new Schema({
    id: {
        type: String,
        unique: true,
        required: [true, 'Please add the role ID'],
    },
    name: {
        type: String,
        unique: [true, 'Role name must be unique'],
        required: [true, 'Please add the role name'],
        minlength: [3, 'Role name must be at least 3 characters long'],
        maxlength: [50, 'Role name must be less than 50 characters long'],
    },
    permissions: [{
        type: Schema.Types.ObjectId,
        ref: 'Permission',
        validate: {
            validator: mongooseSchemaHelpers.createDocumentExistenceValidator('PermissionModel', 'Invalid permission ID. The referenced permission does not exist.'),
            message: 'Invalid permission ID. The referenced permission does not exist.',
        },
    }],
});

// Applying utility functions
mongooseSchemaHelpers.addPreSaveMiddlewareForTimestampsAndId(roleSchema);
mongooseSchemaHelpers.addCommonSchemaFields(roleSchema);

export default mongoose.model('Role', roleSchema);
