// shared/util/SlugUtils.java
package cl.marketprime.shared.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NON_ASCII    = Pattern.compile("[^\\p{ASCII}]");
    private static final Pattern NON_ALPHANUM = Pattern.compile("[^a-z0-9\\s-]");
    private static final Pattern WHITESPACE   = Pattern.compile("[\\s-]+");

    private SlugUtils() {}

    public static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return WHITESPACE.matcher(
                NON_ALPHANUM.matcher(
                                NON_ASCII.matcher(normalized).replaceAll("")
                        ).replaceAll("")
                        .trim()
                        .toLowerCase(Locale.ROOT)
        ).replaceAll("-");
    }
}