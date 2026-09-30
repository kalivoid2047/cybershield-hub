from django.utils.text import slugify


def unique_slug(model, text, max_length=140, fallback="item"):
    """A slug for `text` that no existing `model` row uses ("title", "title-2", ...)."""
    base = (slugify(text) or fallback)[: max_length - 8].strip("-") or fallback
    candidate, counter = base, 2
    while model.objects.filter(slug=candidate).exists():
        candidate = f"{base}-{counter}"
        counter += 1
    return candidate
