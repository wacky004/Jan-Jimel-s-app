import { SelectField, TextField, TextareaField } from '../ui'
import { eventTypes } from './quotationData'

export function EventDetails({ form, set, errors }) {
  return <div className="quote-fields">
    <SelectField id="quote-event_type" label="Event type" value={form.event_type} onChange={set('event_type')} hint="Optional — choose the closest match." error={errors.event_type}><option value="">Select event type</option>{eventTypes.map((type) => <option key={type}>{type}</option>)}</SelectField>
    <TextField id="quote-event_date" label="Event date" type="date" value={form.event_date} onChange={set('event_date')} hint="Optional if your date is not yet decided." error={errors.event_date} />
    <TextField id="quote-venue" className="quote-full" label="Venue / location" maxLength={200} value={form.venue} onChange={set('venue')} hint="Optional — include the venue name and area if known." error={errors.venue} />
  </div>
}

export function ContactDetails({ form, set, errors }) {
  return <div className="quote-fields">
    <TextField id="quote-name" className="quote-full" label="Full name" required autoComplete="name" maxLength={150} value={form.name} onChange={set('name')} error={errors.name} />
    <TextField id="quote-phone" label="Phone number" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={set('phone')} hint="Phone or email is required. You may provide both." error={errors.phone} />
    <TextField id="quote-email" label="Email address" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={set('email')} hint="Email or phone is required. We’ll use these details to contact you." error={errors.email} />
  </div>
}

export function AdditionalNotes({ form, set, errors }) {
  return <TextareaField id="quote-items_requested" label="Additional notes / specific requests" value={form.items_requested} onChange={set('items_requested')} hint="Optional — include theme colors, guest numbers or anything else we should know." error={errors.items_requested} />
}

export function Review({ form, selected, others, items }) {
  return <section className="quote-review" aria-labelledby="quote-review-heading"><h3 id="quote-review-heading">Review your request</h3>
    <dl className="quote-review-details">{[['Event', form.event_type], ['Date', form.event_date], ['Venue', form.venue], ['Name', form.name], ['Phone', form.phone], ['Email', form.email]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>
    <h4>Equipment and quantities</h4>
    {Object.keys(selected).length || others.length ? <ul>{Object.entries(selected).map(([id, qty]) => <li key={id}>{items.find((item) => item.id === Number(id))?.name || 'Item'} × {qty}</li>)}{others.map((item, index) => <li key={`other-${index}`}>Other equipment: {item.name} × {item.qty}</li>)}</ul> : <p>No equipment selected. You can still ask about your event.</p>}
    <h4>Additional notes</h4><p className="quote-preserve-lines">{form.items_requested || 'None added'}</p>
    <p className="quote-help">This sends an inquiry. Availability, final pricing and booking details will be confirmed with the team.</p>
  </section>
}
