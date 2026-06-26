import { Injectable, inject, signal, effect, OnDestroy, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { Observable, forkJoin, timer, Subscription, tap } from 'rxjs';
import { baseUrl } from '../../environment';
import { NotificationDto } from '../models/notification.model';
import { PagedResultDto } from '../models/complaint.model';
import { TokenStorageService } from './auth.api.service';
import { ToastService } from '../shared/services/toast.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly toast = inject(ToastService);
  private readonly ngZone = inject(NgZone);

  private hubConnection: HubConnection | null = null;
  private pollingSubscription: Subscription | null = null;

  private readonly _unreadCount = signal<number>(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  constructor() {
    // React to authentication session changes
    effect(() => {
      const session = this.tokenStorage.session();
      if (session) {
        this.startSignalR();
        this.startPolling();
      } else {
        this.stopSignalR();
        this.stopPolling();
        this._unreadCount.set(0);
      }
    });
  }

  private startSignalR(): void {
    if (this.hubConnection && this.hubConnection.state !== HubConnectionState.Disconnected) {
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/notifications`, {
        accessTokenFactory: () => this.tokenStorage.getToken() ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (dto: any) => {
      console.log('Received notification via SignalR:', dto);
      this.ngZone.run(() => {
        const title = dto?.title ?? dto?.Title ?? 'New Notification';
        const message = dto?.message ?? dto?.Message ?? '';
        const displayMsg = message ? `${title}: ${message}` : title;
        this.toast.info(displayMsg, 10000);
        this._unreadCount.update(c => c + 1);
      });
    });

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR NotificationHub connected.');
        this.refreshUnreadCount();
      })
      .catch(err => {
        console.error('Error establishing SignalR connection:', err);
      });
  }

  private stopSignalR(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => {
          console.log('SignalR NotificationHub disconnected.');
        })
        .catch(err => console.error('Error stopping SignalR connection:', err));
      this.hubConnection = null;
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollingSubscription = timer(60000, 60000).subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  refreshUnreadCount(): void {
    if (!this.tokenStorage.getToken()) return;
    this.http.get<number>(`${baseUrl}/api/notification/unread-count`).subscribe({
      next: (count) => this._unreadCount.set(count),
      error: (err) => console.error('Error fetching unread count:', err)
    });
  }

  getPagedNotifications(isRead: boolean | null, page: number, pageSize: number): Observable<PagedResultDto<NotificationDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (isRead !== null) {
      params = params.set('isRead', isRead.toString());
    }

    return this.http.get<PagedResultDto<NotificationDto>>(`${baseUrl}/api/notification`, { params });
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${baseUrl}/api/notification/${notificationId}/read`, {}).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  markAllRead(): Observable<void> {
    return this.http.put<void>(`${baseUrl}/api/notification/mark-all-read`, {}).pipe(
      tap(() => this._unreadCount.set(0))
    );
  }

  markMultipleAsRead(notificationIds: number[]): Observable<any> {
    const requests = notificationIds.map(id => this.http.put<void>(`${baseUrl}/api/notification/${id}/read`, {}));
    return forkJoin(requests).pipe(
      tap(() => this.refreshUnreadCount())
    );
  }

  ngOnDestroy(): void {
    this.stopSignalR();
    this.stopPolling();
  }
}
