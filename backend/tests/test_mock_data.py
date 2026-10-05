from app.mock_data import FALLBACK_MODEL, demo_incidents


def test_demo_set_size_and_counties() -> None:
    items = demo_incidents()
    assert 8 <= len(items) <= 10
    assert all(item.model_name == FALLBACK_MODEL for item in items)
    assert all(item.latitude is not None and item.longitude is not None for item in items)
    assert all(30.1 < item.latitude < 30.8 for item in items)
    assert all(-98.1 < item.longitude < -97.4 for item in items)
