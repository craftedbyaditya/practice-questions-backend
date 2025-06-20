/**
 * Database utility for Supabase interactions
 * Provides methods to easily work with Supabase REST API
 */
const axios = require('axios');
const config = require('../config');

/**
 * Create configured axios instance for Supabase requests
 * @returns {Object} Axios instance with proper headers
 */
const createClient = () => {
  return axios.create({
    baseURL: config.database.supabase.url,
    headers: {
      'apikey': config.database.supabase.key,
      'Authorization': `Bearer ${config.database.supabase.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  });
};

/**
 * Test database connection
 * @returns {Promise} Connection test result
 */
const testConnection = async () => {
  try {
    const client = createClient();
    const response = await client.get('/rest/v1/');
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      data: response.data
    };
  } catch (error) {
    console.error('Database connection error:', error.message);
    return {
      success: false,
      message: `Failed to connect to Supabase: ${error.message}`,
      error
    };
  }
};

/**
 * Generic function to fetch data from a table
 * @param {string} table - Table name
 * @param {Object} queryParams - Query parameters for filtering
 * @returns {Promise<Array>} Data from the table
 */
const fetchData = async (table, queryParams = {}) => {
  try {
    const client = createClient();
    const response = await client.get(`/rest/v1/${table}`, {
      params: queryParams
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${table}:`, error.message);
    throw error;
  }
};

/**
 * Insert data into a table
 * @param {string} table - Table name
 * @param {Object|Array} data - Data to insert (object or array of objects)
 * @returns {Promise<Object>} Inserted data
 */
const insertData = async (table, data) => {
  try {
    const client = createClient();
    const response = await client.post(`/rest/v1/${table}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error inserting data into ${table}:`, error.message);
    throw error;
  }
};

/**
 * Update data in a table
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} match - Match condition (column: value)
 * @returns {Promise<Object>} Updated data
 */
const updateData = async (table, data, match) => {
  try {
    const client = createClient();
    // Convert match object to query string
    const matchString = Object.entries(match)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join('&');
    
    const response = await client.patch(`/rest/v1/${table}?${matchString}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating data in ${table}:`, error.message);
    throw error;
  }
};

/**
 * Delete data from a table
 * @param {string} table - Table name
 * @param {Object} match - Match condition (column: value)
 * @returns {Promise<Object>} Deleted data
 */
const deleteData = async (table, match) => {
  try {
    const client = createClient();
    // Convert match object to query string
    const matchString = Object.entries(match)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join('&');
    
    const response = await client.delete(`/rest/v1/${table}?${matchString}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting data from ${table}:`, error.message);
    throw error;
  }
};

module.exports = {
  testConnection,
  fetchData,
  insertData,
  updateData,
  deleteData
};
