package com.aiot.backend.repository;

import com.aiot.backend.entity.Sensor;
import com.aiot.backend.enums.SensorType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SensorRepository extends JpaRepository<Sensor, String> {
    List<Sensor> findByUser_Id(String userId);
    Optional<Sensor> findByIdAndUser_Id(String sensorId, String userId);
    Optional<Sensor> findByUser_IdAndSensorType(String userId, SensorType sensorType);
}
