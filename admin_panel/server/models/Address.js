import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  receiver: { 
    type: String,
    required: [true, '收件人姓名不能为空']
  },
  contact: {
    type: String,
    required: [true, '联系方式不能为空'],
    validate: {
      validator: function(v) {
        return /^1[3-9]\d{9}$/.test(v);
      },
      message: '请输入有效的手机号码'
    }
  },
  province: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  detail: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

export default mongoose.model('Address', addressSchema);