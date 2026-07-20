import { apiClient } from './client';
import { Announcement, EmergencyContact, FireEducationArticle, Notification } from './models';

export const notificationService = {
  list: () => apiClient.get<Notification[]>('/notifications/list.php'),
  markRead: (notificationId: number) =>
    apiClient.post<{ message: string }>('/notifications/mark_read.php', { notification_id: notificationId }),
  markAllRead: () => apiClient.post<{ message: string }>('/notifications/mark_read.php', { all: true }),
};

export const announcementService = {
  list: () => apiClient.get<Announcement[]>('/announcements/list.php'),
};

export const contactService = {
  list: () => apiClient.get<EmergencyContact[]>('/contacts/list.php', false),
};

export const educationService = {
  list: () => apiClient.get<FireEducationArticle[]>('/education/list.php', false),
  getById: (contentId: number) => apiClient.get<FireEducationArticle>(`/education/detail.php?content_id=${contentId}`, false),
};