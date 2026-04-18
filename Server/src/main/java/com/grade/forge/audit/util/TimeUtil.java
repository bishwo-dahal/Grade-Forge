package com.grade.forge.audit.util;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

public final class TimeUtil {

    public static final ZoneId CENTRAL = ZoneId.of("America/Chicago");

    private TimeUtil() {
    }

    public static ZonedDateTime nowCentral() {
        return ZonedDateTime.now(CENTRAL);
    }

    public static Instant nowCentralMillis() {
        return nowCentral().truncatedTo(ChronoUnit.MILLIS).toInstant();
    }

    public static LocalDate currentDateCentral() {
        return nowCentral().toLocalDate();
    }
}

