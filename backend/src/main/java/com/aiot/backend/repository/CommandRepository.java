package com.aiot.backend.repository;

import com.aiot.backend.entity.Command;
import com.aiot.backend.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommandRepository extends JpaRepository<Command, String> {
    List<Command> findByUser_Id(String userId);
    Optional<Command> findByIdAndUser_Id(String commandId, String userId);
}
