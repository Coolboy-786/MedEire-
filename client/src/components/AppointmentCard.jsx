import React from 'react';

const STATUS_STYLE = {
  pending:   'bg-yellow-50  border-yellow-200  text-yellow-700',
  confirmed: 'bg-blue-50    border-blue-200    text-blue-700',
  completed: 'bg-green-50   border-green-200   text-green-700',
  cancelled: 'bg-gray-50    border-gray-200    text-gray-400',
};

const TRIAGE_BADGE = {
  low:    'bg-green-100  text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high:   'bg-red-100    text-red-700',
};

const TYPE_STYLE = {
  clinic: 'bg-gray-100 text-gray-700',
  video:  'bg-indigo-100 text-indigo-700',
};

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-IE', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

const AppointmentCard = ({
  appointment,
  role,
  onAction,
  actionLabel,
  onVideoAction,
  videoActionLabel = 'Join video appointment',
}) => {
  const {
    status,
    scheduledAt,
    triageLevel,
    symptoms,
    doctorNotes,
    prescription,
    appointmentType = 'clinic',
  } = appointment;
  const other = role === 'patient' ? appointment.doctorId : appointment.patientId;
  const otherLabel = role === 'patient' ? 'Dr.' : 'Patient';
  const canJoinVideo = appointmentType === 'video'
    && onVideoAction
    && ['pending', 'confirmed'].includes(status);

  return (
    <div className={`border rounded-xl p-5 space-y-3 ${STATUS_STYLE[status] || STATUS_STYLE.pending}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">
            {otherLabel} {other?.name || '—'}
            {other?.specialty && <span className="font-normal text-gray-500"> · {other.specialty}</span>}
            {other?.county    && <span className="font-normal text-gray-500"> · {other.county}</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{fmt(scheduledAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[status]}`}>
            {status}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[appointmentType] || TYPE_STYLE.clinic}`}>
            {appointmentType === 'video' ? 'Video' : 'Clinic'}
          </span>
          {triageLevel && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRIAGE_BADGE[triageLevel]}`}>
              {triageLevel} risk
            </span>
          )}
        </div>
      </div>

      {symptoms?.length > 0 && (
        <p className="text-xs text-gray-600">
          <span className="font-medium">Symptoms:</span> {symptoms.join(', ')}
        </p>
      )}

      {doctorNotes && (
        <div className="bg-white rounded-lg p-3 border border-green-100 space-y-1">
          <p className="text-xs font-semibold text-gray-700">Doctor's notes</p>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{doctorNotes}</p>
          {prescription && (
            <>
              <p className="text-xs font-semibold text-gray-700 pt-1">Prescription</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap">{prescription}</p>
            </>
          )}
        </div>
      )}

      {(canJoinVideo || (onAction && actionLabel)) && (
        <div className="flex flex-wrap gap-3">
          {canJoinVideo && (
            <button
              onClick={() => onVideoAction(appointment)}
              className="text-sm font-medium text-indigo-700 hover:underline"
            >
              {videoActionLabel}
            </button>
          )}
          {onAction && actionLabel && (
            <button
              onClick={() => onAction(appointment)}
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
