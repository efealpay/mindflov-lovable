// @ts-nocheck
import React from 'react';
// @ts-ignore
import { Joyride, STATUS } from 'react-joyride';

const TutorialModal = ({ isOpen, onClose }: any) => {
  const steps: any[] = [
    {
      target: 'body',
      content: 'Welcome to Mindflov! This brief tutorial will guide you through the interface.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '#main-input-bar',
      content: 'To manually add new starting concepts to the canvas, double-click anywhere on the empty canvas.',
      placement: 'top',
    },
    {
      target: '#mode-selector',
      content: 'Select how you want the AI to expand your concepts. "Neural Bridge" explores related keywords, "Visual Metaphor" builds analogies, and "Strategic Logic" focuses on practical structures.',
      placement: 'top',
    },
    {
      target: '#hud-sidebar',
      content: 'The sidebar displays your usage quota, graph simulation controls, the Auto-Connect (Neural Analysis) tool, and links back to the Home Dashboard.',
      placement: 'right',
    },
    {
      target: 'body',
      content: 'To expand an idea using AI, click on any node to select it, then click the sparkle (AI) button in its context menu. Try it out now!',
      placement: 'center',
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Joyride
      {...({
        steps,
        run: isOpen,
        continuous: true,
        scrollToFirstStep: true,
        showProgress: true,
        showSkipButton: true,
        callback: handleJoyrideCallback,
        styles: {
          options: {
            zIndex: 10000,
            primaryColor: '#6366f1',
            backgroundColor: '#0f172a',
            textColor: '#ffffff',
            arrowColor: '#0f172a',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
          },
          buttonClose: {
            display: 'none',
          },
          tooltip: {
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '16px',
          },
          buttonNext: {
            backgroundColor: '#4f46e5',
            borderRadius: '8px',
            padding: '8px 16px',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: '#cbd5e1',
          },
          buttonSkip: {
            color: '#94a3b8',
          }
        }
      } as any)}
    />
  );
};

export default TutorialModal;

