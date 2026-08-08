/**
 * CameraInput tests.
 *
 * jsdom exposes `ontouchstart` in window so `isTouchDevice` evaluates to true
 * in this test environment. Tests that depend on device-mode are labelled
 * accordingly. Core functionality (error handling, preview) is device-agnostic.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraInput } from './CameraInput';

const noop = () => {};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CameraInput — error handling', () => {
  it('shows error when file exceeds 5 MB', () => {
    const { container } = render(<CameraInput onCapture={noop} onClear={noop} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024, configurable: true });
    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(screen.getByText(/Image too large/)).toBeInTheDocument();
  });

  it('shows error for non-image file type', () => {
    const { container } = render(<CameraInput onCapture={noop} onClear={noop} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const textFile = new File(['hello'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [textFile] } });
    expect(screen.getByText(/Please select an image file/)).toBeInTheDocument();
  });

  it('does not call onCapture when file is invalid', () => {
    const onCapture = vi.fn();
    const { container } = render(<CameraInput onCapture={onCapture} onClear={noop} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const textFile = new File(['x'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [textFile] } });
    expect(onCapture).not.toHaveBeenCalled();
  });
});

describe('CameraInput — preview', () => {
  it('shows preview image when preview prop is provided', () => {
    render(<CameraInput onCapture={noop} onClear={noop} preview="abc123" />);
    const img = screen.getByAltText('Captured problem') as HTMLImageElement;
    expect(img.src).toContain('data:image/jpeg;base64,abc123');
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<CameraInput onCapture={noop} onClear={onClear} preview="abc123" />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('hides main input buttons when preview is set', () => {
    const { container } = render(<CameraInput onCapture={noop} onClear={noop} preview="abc123" />);
    // Only the clear button should be present, no file input buttons
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(0);
  });
});

describe('CameraInput — device-mode rendering (jsdom env = touch)', () => {
  // jsdom has ontouchstart, so isTouchDevice = true here.
  // This test group documents the touch-device render path.

  it('renders camera button as primary action on touch device', () => {
    const { container } = render(<CameraInput onCapture={noop} onClear={noop} />);
    const buttons = container.querySelectorAll('button');
    // At minimum one button (camera/upload), potentially 2 (with gallery)
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Take Photo" label in non-compact touch mode', () => {
    render(<CameraInput onCapture={noop} onClear={noop} compact={false} />);
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
  });

  it('shows "From Gallery" button in non-compact touch mode', () => {
    render(<CameraInput onCapture={noop} onClear={noop} compact={false} />);
    expect(screen.getByText('From Gallery')).toBeInTheDocument();
  });

  it('hides label and gallery button in compact mode', () => {
    render(<CameraInput onCapture={noop} onClear={noop} compact={true} />);
    expect(screen.queryByText('Take Photo')).toBeNull();
    expect(screen.queryByText('Upload Image')).toBeNull();
    expect(screen.queryByText('From Gallery')).toBeNull();
  });
});
