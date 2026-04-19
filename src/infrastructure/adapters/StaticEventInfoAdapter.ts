import {
  ExternalEventInfoProviderPort,
  EventInfo
} from '../../core/interfaces/ExternalEventInfoProviderPort';
import { specialEventFactorPriceMap } from '../data/staticFactorEventInfoData';
import { normalizeKey, specialEventAveragePriceMap } from '../data/staticAveragePriceEventInfoData';

/**
 * Helper function to search for a key in a map within a date window
 * @param ticker The asset ticker
 * @param eventType The event type
 * @param eventDate The event date
 * @param map The map to search in
 * @param windowDays The number of days to search before and after the event date
 * @returns The found value and the day offset, or [undefined, 0] if not found
 */
function searchWithinDateWindow<T>(
  ticker: string,
  eventType: string,
  eventDate: Date,
  map: Map<string, T>,
  windowDays: number = 20
): [T | undefined, number] {
  // First try exact date match
  const normalizedKey = normalizeKey(ticker, eventType, eventDate);
  const exactMatch = map.get(normalizedKey);

  if (exactMatch !== undefined) {
    return [exactMatch, 0];
  }

  // If not found, try with a ±windowDays day window
  const dayInMs = 24 * 60 * 60 * 1000; // milliseconds in a day

  // Try each day in the window, starting from closest to furthest
  for (let dayOffset = 1; dayOffset <= windowDays; dayOffset++) {
    // Try future date
    const futureDateKey = normalizeKey(
      ticker,
      eventType,
      new Date(eventDate.getTime() + dayOffset * dayInMs)
    );
    const futureMatch = map.get(futureDateKey);
    if (futureMatch !== undefined) {
      return [futureMatch, dayOffset];
    }

    // Try past date
    const pastDateKey = normalizeKey(
      ticker,
      eventType,
      new Date(eventDate.getTime() - dayOffset * dayInMs)
    );
    const pastMatch = map.get(pastDateKey);
    if (pastMatch !== undefined) {
      return [pastMatch, -dayOffset];
    }
  }

  return [undefined, 0];
}

export class StaticEventInfoAdapter implements ExternalEventInfoProviderPort {
  async getEventsForAsset(ticker: string, year?: number): Promise<any[]> {
    const events: any[] = [];
    const normalizedTargetTicker = normalizeKey(ticker, '', new Date()).split('-')[0]; // Extract normalized ticker part
    
    for (const info of specialEventFactorPriceMap.values()) {
      const normalizedInfoTicker = normalizeKey(info.ticker, '', new Date()).split('-')[0];
      
      if (normalizedInfoTicker === normalizedTargetTicker) {
        if (!year || info.date.getFullYear() === year) {
          events.push({
            date: info.date,
            year: info.date.getFullYear(),
            month: info.date.getMonth() + 1,
            type: info.type,
            assetCode: info.ticker,
            assetName: info.ticker, // Default to ticker if name not available
            quantity: 0, // Should be calculated based on position at that date
            unitPrice: 0,
            totalValue: 0,
            fees: 0,
            taxes: 0,
            netValue: 0,
            assetCategory: '', // To be filled by processor
            brokerName: 'B3',
            brokerCode: 'B3',
            factor: info.factor
          });
        }
      }
    }
    return events;
  }

  async getEventFactor(ticker: string, eventType: string, eventDate: Date): Promise<number | null> {
    const normalizedKey = normalizeKey(ticker, eventType, eventDate);
    const [staticInfo, dayOffset] = searchWithinDateWindow<EventInfo>(
      ticker,
      eventType,
      eventDate,
      specialEventFactorPriceMap
    );

    if (staticInfo) {
      if (dayOffset === 0) {
        console.log(`[Static Event Data Hit] Found info for ${normalizedKey}:`, staticInfo);
      } else {
        console.log(`[Static Event Data Hit] Found info within ${dayOffset > 0 ? '+' : ''}${dayOffset} days for ${normalizedKey}:`, staticInfo);
      }
      return staticInfo.factor;
    }

    console.warn(`[Static Event Data Miss] Event info for ${normalizedKey} not found within window days.`);
    return null;
  }

  /**
   * Get the average price for a special event (Atualização, Direito de Subscrição, Cessão de Direitos - Solicitada)
   * @param ticker The asset ticker
   * @param eventType The event type
   * @param eventDate The event date
   * @returns The average price or null if not found
   */
  async getSpecialEventAveragePrice(
    ticker: string,
    eventType: string,
    eventDate: Date
  ): Promise<number | null> {
    const normalizedKey = normalizeKey(ticker, eventType, eventDate);
    const [price, dayOffset] = searchWithinDateWindow<number>(
      ticker,
      eventType,
      eventDate,
      specialEventAveragePriceMap
    );

    if (price !== undefined) {
      if (dayOffset === 0) {
        console.log(`[Static Event Price Hit] Found price for ${normalizedKey}: ${price}`);
      } else {
        console.log(`[Static Event Price Hit] Found price within ${dayOffset > 0 ? '+' : ''}${dayOffset} days for ${normalizedKey}: ${price}`);
      }
      return price;
    }

    console.warn(`[Static Event Price Miss] Special event average price for ${normalizedKey} not found within window days.`);
    return null;
  }
}
