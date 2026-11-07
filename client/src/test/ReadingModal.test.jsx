import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingModal from '../components/ReadingModal';

describe('ReadingModal Component', () => {
  it('renders modal when open', () => {
    render(<ReadingModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Log New Glucose Reading')).toBeInTheDocument();
    expect(screen.getByLabelText(/Blood Glucose Value/i)).toBeInTheDocument();
  });

  it('shows error when glucose value is empty: "Please enter a glucose value."', async () => {
    render(<ReadingModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    });
  });

  it('shows error when value is below 40 or above 600: "Value must be between 40 and 600 mg/dl."', async () => {
    render(<ReadingModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    const valueInput = screen.getByLabelText(/Blood Glucose Value/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    // Below 40
    fireEvent.change(valueInput, { target: { value: '35' } });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    });

    // Above 600
    fireEvent.change(valueInput, { target: { value: '650' } });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument();
    });
  });

  it('shows error when date is in the future: "Date cannot be in the future."', async () => {
    render(<ReadingModal isOpen={true} onClose={() => {}} onSave={() => {}} />);
    const dateInput = screen.getByLabelText(/Date/i);
    const valueInput = screen.getByLabelText(/Blood Glucose Value/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    fireEvent.change(dateInput, { target: { value: '2099-12-31' } });
    fireEvent.change(valueInput, { target: { value: '110' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
    });
  });

  it('calls onSave with valid data and whole number', async () => {
    const handleSave = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();
    render(<ReadingModal isOpen={true} onClose={handleClose} onSave={handleSave} />);

    const valueInput = screen.getByLabelText(/Blood Glucose Value/i);
    const submitBtn = screen.getByRole('button', { name: /Save Reading/i });

    fireEvent.change(valueInput, { target: { value: '120' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 120,
          slot: 'Morning (fasting)',
        })
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
