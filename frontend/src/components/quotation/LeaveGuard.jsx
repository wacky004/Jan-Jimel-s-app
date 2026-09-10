import { useCallback, useEffect } from 'react'
import { useBeforeUnload, useBlocker } from 'react-router-dom'
import { ConfirmationDialog } from '../ui'

export default function LeaveGuard({ dirty, submitting }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname)
  useBeforeUnload(useCallback((event) => {
    if (dirty) { event.preventDefault(); event.returnValue = '' }
  }, [dirty]))
  useEffect(() => {
    if (!dirty && blocker.state === 'blocked') blocker.reset()
  }, [dirty, blocker])
  return <ConfirmationDialog
    open={blocker.state === 'blocked'}
    onClose={() => blocker.reset?.()}
    onConfirm={() => blocker.proceed?.()}
    title={submitting ? 'Your request is being sent' : 'Leave this quotation?'}
    description={submitting ? 'Please wait for the result before leaving this page.' : 'Your unsent event details and equipment selections will be lost.'}
    confirmLabel="Leave quotation" cancelLabel="Keep editing" busy={submitting}
  />
}
