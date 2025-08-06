import React from 'react';

// Google Symbol Icon Component
const GoogleIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <span 
    className={`icon ${className || ''}`} 
    style={{ 
      fontFamily: 'Google Symbols',
      verticalAlign: 'middle',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1,
      ...style 
    }}
  >
    {name}
  </span>
);

export const UploadIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="upload" className={className} style={style} />
);

export const CheckCircleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="check_circle" className={className} style={style} />
);

export const LightbulbIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="lightbulb" className={className} style={style} />
);

export const SendIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="send" className={className} style={style} />
);

export const SparklesIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="auto_awesome" className={className} style={style} />
);

export const UserIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="person" className={className} style={style} />
);

export const BotIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="smart_toy" className={className} style={style} />
);

export const ClipboardIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="assignment" className={className} style={style} />
);

export const LoadingSpinner = () => (
  <div className="loading-spinner"></div>
);

export const HomeIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="home" className={className} style={style} />
);

export const ChatBubbleLeftRightIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="chat" className={className} style={style} />
);

export const QuestionMarkCircleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="help" className={className} style={style} />
);

export const ArrowRightIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="arrow_forward" className={className} style={style} />
);

export const MagicWandIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="auto_fix_high" className={className} style={style} />
);

export const ChevronDownIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="expand_more" className={className} style={style} />
);

export const ChevronUpIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="expand_less" className={className} style={style} />
);

export const XCircleIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <GoogleIcon name="cancel" className={className} style={style} />
);
