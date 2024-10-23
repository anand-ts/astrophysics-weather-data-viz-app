// src/queries.js
import { gql } from '@apollo/client';

export const GET_WEATHER_DATA = gql`
  query GetWeatherData($limit: Int, $startDate: String, $endDate: String) {
    getWeatherData(limit: $limit, startDate: $startDate, endDate: $endDate) {
      wdatetime
      temperature_k
      dewpoint_k
      pressure_kpa
      relhumidity_pct
      winddir_deg
      windspeed_mps
      pwv_mm
      phaserms_deg
      tau183ghz
      tau215ghz
      tau225ghz
    }
  }
`;
