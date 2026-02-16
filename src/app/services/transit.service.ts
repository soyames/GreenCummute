import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TransitConnection {
  id: string;
  from: {
    name: string;
    lat: number;
    lng: number;
    departure: Date;
  };
  to: {
    name: string;
    lat: number;
    lng: number;
    arrival: Date;
  };
  line: string;
  type: 'bus' | 'train' | 'tram' | 'subway';
  operator: string;
  duration: number; // in minutes
  delay?: number; // in minutes
  platform?: string;
  direction?: string;
}

export interface TransitSchedule {
  connections: TransitConnection[];
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TransitService {
  private baseUrl = environment.oebbApi.baseUrl;

  constructor(private http: HttpClient) {}

  // Search for transit connections
  async searchConnections(
    from: string,
    to: string,
    date?: Date,
    time?: string
  ): Promise<TransitConnection[]> {
    try {
      // OEBB API endpoint for journey planning
      const params: any = {
        from,
        to,
        date: date ? this.formatDate(date) : this.formatDate(new Date()),
        time: time || this.formatTime(new Date())
      };

      // This would call the actual OEBB API
      // For now, return mock data
      return this.getMockConnections(from, to);
    } catch (error) {
      console.error('Error fetching transit connections:', error);
      return [];
    }
  }

  // Get real-time updates for a connection
  async getConnectionUpdates(connectionId: string): Promise<TransitConnection | null> {
    try {
      // This would fetch real-time updates from OEBB API
      return null;
    } catch (error) {
      console.error('Error fetching connection updates:', error);
      return null;
    }
  }

  // Get nearby stations
  async getNearbyStations(lat: number, lng: number, radius: number = 500): Promise<any[]> {
    try {
      // This would call OEBB API to find nearby stations
      return [];
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
      return [];
    }
  }

  // Format date for API
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format time for API
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Mock data for development
  private getMockConnections(from: string, to: string): TransitConnection[] {
    const now = new Date();
    const connections: TransitConnection[] = [];

    // Generate 5 mock connections
    for (let i = 0; i < 5; i++) {
      const departureTime = new Date(now.getTime() + (i * 15 + 5) * 60000);
      const duration = 25 + Math.floor(Math.random() * 20);
      const arrivalTime = new Date(departureTime.getTime() + duration * 60000);

      connections.push({
        id: `conn_${i}`,
        from: {
          name: from,
          lat: 48.2082,
          lng: 16.3738,
          departure: departureTime
        },
        to: {
          name: to,
          lat: 48.2208,
          lng: 16.3500,
          arrival: arrivalTime
        },
        line: ['U1', 'U2', 'U3', 'S7', 'Bus 13A'][Math.floor(Math.random() * 5)],
        type: ['train', 'tram', 'bus', 'subway'][Math.floor(Math.random() * 4)] as any,
        operator: 'Wiener Linien',
        duration,
        delay: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : undefined,
        platform: `${Math.floor(Math.random() * 10) + 1}`,
        direction: to
      });
    }

    return connections;
  }

  // Get service alerts and disruptions
  async getServiceAlerts(): Promise<any[]> {
    try {
      // This would fetch from OEBB API or city transit API
      return [];
    } catch (error) {
      console.error('Error fetching service alerts:', error);
      return [];
    }
  }
}
