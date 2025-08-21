import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('IT Helpdesk Simulator');
  });

  it('renders the setup complete message', () => {
    render(<Home />);
    const message = screen.getByText('Development environment setup complete!');
    expect(message).toBeInTheDocument();
  });
});