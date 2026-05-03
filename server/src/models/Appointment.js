const mongoose = require('mongoose');

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    appointmentType: {
      type: String,
      enum: ['clinic', 'video'],
      default: 'clinic',
    },
    videoRoomId: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    symptoms:    [{ type: String }],
    triageLevel: { type: String, enum: ['low', 'medium', 'high'] },
    doctorNotes:  { type: String },
    prescription: { type: String },
  },
  { timestamps: true }
);

// Prevent double-booking: one active appointment per doctor per time slot.
appointmentSchema.index(
  { doctorId: 1, scheduledAt: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
