package com.grade.forge.audit.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TimeUtilTest {

    @Test
    void centralZoneIsAlwaysAmericaChicago() {
        assertEquals("America/Chicago", TimeUtil.CENTRAL.getId());
    }
}

