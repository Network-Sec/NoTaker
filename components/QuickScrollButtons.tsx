import React from 'react';

interface QuickScrollButtonsProps {
  streamRef: React.RefObject<HTMLDivElement>;
}

interface StreamItemData {
  element: HTMLElement;
  offsetTop: number;
  timestamp: number; // Unix timestamp
}

const QuickScrollButtons: React.FC<QuickScrollButtonsProps> = ({ streamRef }) => {
  const getSortedStreamItems = (): StreamItemData[] => {
    if (!streamRef.current) return [];
    const streamItems: StreamItemData[] = [];
    const elements = streamRef.current.querySelectorAll<HTMLElement>('.memo-item, .right-side-item');

    elements.forEach(element => {
      const timestampStr = element.dataset.timestamp;
      if (timestampStr) {
        streamItems.push({
          element,
          offsetTop: element.offsetTop,
          timestamp: new Date(timestampStr).getTime(),
        });
      }
    });

    // Sort by offsetTop, as this represents their visual order in the stream
    return streamItems.sort((a, b) => a.offsetTop - b.offsetTop);
  };

  const scrollToPosition = (offsetTop: number) => {
    if (streamRef.current) {
      streamRef.current.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  const scrollTo = (position: 'top' | 'bottom') => {
    if (streamRef.current) {
      streamRef.current.scrollTo({
        top: position === 'top' ? 0 : streamRef.current.scrollHeight - streamRef.current.clientHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollByAmount = (amount: number) => {
    if (streamRef.current) {
      streamRef.current.scrollBy({
        top: amount,
        behavior: 'smooth',
      });
    }
  };

  const scrollByEntry = (direction: 'next' | 'prev') => {
    if (!streamRef.current) return;

    const items = getSortedStreamItems();
    if (items.length === 0) return;

    const currentScrollTop = streamRef.current.scrollTop;

    let targetItem: StreamItemData | undefined;

    if (direction === 'next') {
      // Find the first item that is below the current scroll position
      targetItem = items.find(item => item.offsetTop > currentScrollTop + 1); // +1 to ensure it's truly next
    } else { // 'prev'
      // Find the last item that is above the current scroll position
      targetItem = items.slice().reverse().find(item => item.offsetTop < currentScrollTop - 1); // -1 to ensure it's truly prev
    }

    if (targetItem) {
      scrollToPosition(targetItem.offsetTop);
    } else if (direction === 'next') {
        scrollTo('bottom');
    } else { // direction === 'prev'
        scrollTo('top');
    }
  };

  const scrollByHour = (direction: 'back' | 'forw') => {
    if (!streamRef.current) return;

    const items = getSortedStreamItems();
    if (items.length === 0) return;

    const currentScrollTop = streamRef.current.scrollTop;
    const streamHeight = streamRef.current.clientHeight;

    // Find the closest item to the current viewport's top edge
    let currentVisibleItem: StreamItemData | undefined;
    for (const item of items) {
        if (item.offsetTop >= currentScrollTop && item.offsetTop < currentScrollTop + streamHeight) {
            currentVisibleItem = item;
            break;
        }
        if (item.offsetTop < currentScrollTop) {
            currentVisibleItem = item; // Keep track of the last item before currentScrollTop
        }
    }
    // If no item is found in or after the viewport, take the last item
    if (!currentVisibleItem && items.length > 0) {
        currentVisibleItem = items[items.length - 1];
    }
    
    // Fallback to current time if no suitable item found (e.g., empty stream)
    const baseTimestamp = currentVisibleItem ? currentVisibleItem.timestamp : new Date().getTime();
    let targetTimestamp = baseTimestamp;

    if (direction === 'forw') {
      targetTimestamp += 60 * 60 * 1000; // Add one hour
    } else { // 'back'
      targetTimestamp -= 60 * 60 * 1000; // Subtract one hour
    }

    let targetItem: StreamItemData | undefined;

    if (direction === 'forw') {
      // Find the first item whose timestamp is greater than or equal to the target timestamp
      targetItem = items.find(item => item.timestamp >= targetTimestamp);
      // If no item found greater than targetTimestamp, go to the very bottom
      if (!targetItem) {
          scrollTo('bottom');
          return;
      }
    } else { // 'back'
      // Find the last item whose timestamp is less than or equal to the target timestamp
      // Iterate in reverse to find the "last" item effectively
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].timestamp <= targetTimestamp) {
          targetItem = items[i];
          break;
        }
      }
      // If no item found less than targetTimestamp, go to the very top
      if (!targetItem) {
          scrollTo('top');
          return;
      }
    }

    if (targetItem) {
      scrollToPosition(targetItem.offsetTop);
    }
  };


  return (
    <div className="quick-scroll-buttons">
      <div className="flex-row button-groups-wrapper">
        <div className="all-up-down flex-column">
          <button onClick={() => scrollTo('top')}>All Up</button>
          <button onClick={() => scrollTo('bottom')}>All Down</button>
        </div>
        <div className="prev-next-entry flex-column">
          <button onClick={() => scrollByEntry('prev')}>Prev Entry</button>
          <button onClick={() => scrollByEntry('next')}>Next Entry</button>
        </div>
        <div className="hour-scroll flex-column">
          <button onClick={() => scrollByHour('back')}>-1 hr</button>
          <button onClick={() => scrollByHour('forw')}>+1 hr</button>
        </div>
        <div className="fine-scroll flex-column">
          <button onClick={() => scrollByAmount(-100)}>▲ Up</button>
          <button onClick={() => scrollByAmount(100)}>▼ Down</button>
        </div>
      </div>
    </div>
  );
};

export default QuickScrollButtons;
