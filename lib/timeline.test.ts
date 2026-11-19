import { describe, expect, it } from 'vitest';
import { TIMELINE_STEPS, timelineStatus, FINAL_STATES } from './timeline';
import type { PoolState } from './types';

describe('timeline state mapping', () => {
  describe('timelineStatus', () => {
    it('maps Open state to joining step', () => {
      expect(timelineStatus('Open', false)).toEqual({ step: 0, failed: false });
      expect(timelineStatus('Open', true)).toEqual({ step: 0, failed: false });
    });

    it('maps Filled state to filled step', () => {
      expect(timelineStatus('Filled', false)).toEqual({ step: 1, failed: false });
      expect(timelineStatus('Filled', true)).toEqual({ step: 1, failed: false });
    });

    it('maps Accepted state to accepted step', () => {
      expect(timelineStatus('Accepted', false)).toEqual({ step: 2, failed: false });
      expect(timelineStatus('Accepted', true)).toEqual({ step: 2, failed: false });
    });

    it('maps Dispatched state to onTheWay step', () => {
      expect(timelineStatus('Dispatched', false)).toEqual({ step: 3, failed: false });
      expect(timelineStatus('Dispatched', true)).toEqual({ step: 3, failed: false });
    });

    it('maps Delivered state to arrived or collected depending on iCollected', () => {
      expect(timelineStatus('Delivered', false)).toEqual({ step: 4, failed: false });
      expect(timelineStatus('Delivered', true)).toEqual({ step: 5, failed: false });
    });

    it('maps Settled state to done step', () => {
      expect(timelineStatus('Settled', false)).toEqual({ step: 6, failed: false });
      expect(timelineStatus('Settled', true)).toEqual({ step: 6, failed: false });
    });

    it('maps failed states to failed status', () => {
      const failedStates: PoolState[] = ['Expired', 'Failed', 'Cancelled'];
      for (const state of failedStates) {
        expect(timelineStatus(state, false)).toEqual({ step: -1, failed: true });
        expect(timelineStatus(state, true)).toEqual({ step: -1, failed: true });
      }
    });
  });

  describe('TIMELINE_STEPS', () => {
    it('has correct order and length', () => {
      expect(TIMELINE_STEPS).toEqual(['joining', 'filled', 'accepted', 'onTheWay', 'arrived', 'collected', 'done']);
      expect(TIMELINE_STEPS).toHaveLength(7);
    });

    it('contains no duplicates', () => {
      const unique = new Set(TIMELINE_STEPS);
      expect(unique.size).toBe(TIMELINE_STEPS.length);
    });
  });

  describe('FINAL_STATES', () => {
    it('contains only terminal pool states', () => {
      expect(FINAL_STATES).toEqual(['Settled', 'Expired', 'Failed', 'Cancelled']);
      expect(FINAL_STATES).toHaveLength(4);
    });

    it('contains no duplicates', () => {
      const unique = new Set(FINAL_STATES);
      expect(unique.size).toBe(FINAL_STATES.length);
    });

    it('all final states map to failed status', () => {
      for (const state of FINAL_STATES) {
        const result = timelineStatus(state, false);
        expect(result.failed).toBe(state !== 'Settled');
        if (state === 'Settled') {
          expect(result.step).toBe(6);
        }
      }
    });
  });

  describe('step indices match TIMELINE_STEPS array', () => {
    it('all non-failed states map to indices within TIMELINE_STEPS bounds', () => {
      const happyPathStates: PoolState[] = ['Open', 'Filled', 'Accepted', 'Dispatched', 'Delivered', 'Settled'];
      for (const state of happyPathStates) {
        const result = timelineStatus(state, false);
        expect(result.step).toBeGreaterThanOrEqual(0);
        expect(result.step).toBeLessThan(TIMELINE_STEPS.length);
      }
    });
  });
});
