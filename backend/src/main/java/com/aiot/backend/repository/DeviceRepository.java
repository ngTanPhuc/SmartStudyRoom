package com.aiot.backend.repository;

import com.aiot.backend.entity.Device;
import com.aiot.backend.enums.DeviceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {
    List<Device> findByUser_Id(String userId);
    Optional<Device> findByIdAndUser_Id(String deviceId, String userId);
    Optional<Device> findByUser_IdAndDeviceType(String userId, DeviceType deviceType);
}
