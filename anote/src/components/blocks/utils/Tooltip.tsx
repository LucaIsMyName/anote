import React from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/shift-away.css';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  // Extending common Tippy props that we want to expose
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' | 'left-end' | 'left-start' | 'right-end' | 'right-start';
  trigger?: 'click' | 'mouseenter' | 'focus' | 'manual';
  theme?: 'light' | 'dark';
  interactive?: boolean;
  arrow?: boolean;
  offset?: [number, number];
  className?: string;
  visible?: boolean;
  onClickOutside?: () => void;
}

const Tooltip = ({
  children,
  content,
  placement = 'top',
  trigger = 'mouseenter',
  theme = 'dark',
  interactive = false,
  arrow = true,
  offset = [0, 0],
  className = '',
  visible,
  onClickOutside,
  ...props
}: TooltipProps) => {
  return (
    <Tippy
      content={content}
      placement={placement}
      trigger={trigger}
      theme={theme}
      interactive={interactive}
      arrow={arrow}
      offset={offset}
      className={className}
      visible={visible}
      onClickOutside={onClickOutside}
      animation="shift-away"
      {...props}
    >
      <div className="inline-block">{children}</div>
    </Tippy>
  );
};

export default Tooltip;