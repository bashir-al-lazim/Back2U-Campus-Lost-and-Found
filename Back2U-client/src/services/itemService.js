// ========================
// ITEM SERVICE (Model Layer)
// ========================
import api from '../config/api';

class ItemService {
  // Get all items with filters
  async getAllItems(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`/items?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get single item by ID
  async getItemById(id) {
    try {
      const response = await api.get(`/items/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Create new item
  async createItem(itemData) {
    try {
      const response = await api.post('/items', itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Update item
  async updateItem(id, itemData) {
    try {
      const response = await api.put(`/items/${id}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Delete item
  async deleteItem(id) {
    try {
      const response = await api.delete(`/items/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Get items by user
  async getItemsByUser(userId) {
    try {
      const response = await api.get(`/items/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default new ItemService();
