import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// JSDOM has no layout/top layer. These shims test our React focus lifecycle;
// real-browser QA must separately verify native inertness and Escape dispatch.
HTMLElement.prototype.getClientRects = function () {
  return this.closest('[hidden]') || this.style.display === 'none' ? [] : [{ width: 100, height: 40 }]
}
HTMLElement.prototype.scrollIntoView = function () {}
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }

afterEach(() => cleanup())
