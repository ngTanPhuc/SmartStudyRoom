package com.aiot.backend.repository;

import com.aiot.backend.entity.SensorData;
import com.aiot.backend.entity.SensorDataId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, SensorDataId> {
    List<SensorData> findById_SensorIdOrderById_TimestampDesc(String sensorId);
    List<SensorData> findTop2ById_SensorIdOrderById_TimestampDesc(String sensorId);
    Optional<SensorData> findTopById_SensorIdOrderById_TimestampDesc(String sensorId);
}
