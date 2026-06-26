export interface NotificationDto {
  notificationId: number;
  notificationTypeId: number;
  notificationTypeName: string;
  referenceComplaintId: number | null;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
