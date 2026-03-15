import netCDF4 as nc
import numpy as np
import os

def generate_perfect_dataset(output_path):
    print(f"Generating high-fidelity demo dataset: {output_path}")
    
    # Grid definition: 2.5 x 2.5 degree global resolution
    lats = np.arange(-90, 91, 2.5)
    lons = np.arange(-180, 181, 2.5)
    num_lats = len(lats)
    num_lons = len(lons)
    
    # Create the dataset (Use NETCDF3_CLASSIC for browser compatibility with netcdfjs)
    ds = nc.Dataset(output_path, "w", format="NETCDF3_CLASSIC")
    
    # Global Attributes for ClimateLens detection
    ds.year = 2025
    ds.description = "ClimateLens High-Fidelity Demo Dataset - Optimized for Presentation"
    ds.source = "Synthetic Earth System Model Pulse"
    
    # Dimensions
    ds.createDimension("lat", num_lats)
    ds.createDimension("lon", num_lons)
    
    # Variables
    lat_var = ds.createVariable("lat", "f4", ("lat",))
    lon_var = ds.createVariable("lon", "f4", ("lon",))
    
    temp_var = ds.createVariable("temp", "f4", ("lat", "lon"))
    prec_var = ds.createVariable("precip", "f4", ("lat", "lon"))
    wind_var = ds.createVariable("wind", "f4", ("lat", "lon"))
    
    # Units and Metadata for scientific look
    lat_var.units = "degrees_north"
    lon_var.units = "degrees_east"
    temp_var.units = "Celsius"
    prec_var.units = "mm"
    wind_var.units = "km/h"
    
    # Assign coordinates
    lat_var[:] = lats
    lon_var[:] = lons
    
    # Base masks for broadcasting
    lat_grid = lats[:, np.newaxis]
    
    # 1. Temperature Generation
    # Base: Cosine curve + Noise
    temp_data = 30 * np.cos(np.deg2rad(lat_grid)) * np.ones((1, num_lons))
    temp_data += np.random.normal(0, 1.5, size=(num_lats, num_lons))
        
    # INJECT ANOMALIES (The "Wow" Factor)
    # Major Heatwave in Europe/Central Asia
    temp_data[50:65, 80:120] += 12.0  
    # Polar Amplification (Arctic warming)
    temp_data[68:, :] += 7.5
    # cooling anomaly in South Pacific
    temp_data[10:30, 100:140] -= 5.0
    
    # 2. Precipitation Generation
    # Base: Tropical Belt focus
    prec_data = np.exp(-(lat_grid / 20)**2) * 200 * np.ones((1, num_lons))
    prec_data += np.random.uniform(0, 50, size=(num_lats, num_lons))
    # Monsoon in SE Asia
    prec_data[38:52, 110:145] *= 3.0
    
    # 3. Wind Speed Generation
    # Base: High at mid-latitudes (Jet Streams)
    wind_data = 15 + 35 * np.abs(np.sin(np.deg2rad(lat_grid * 2))) * np.ones((1, num_lons))
    wind_data += np.random.normal(0, 5, size=(num_lats, num_lons))
    # Storm system in North Atlantic
    wind_data[60:70, 50:75] += 40
    
    # Clip and Assign
    temp_var[:] = np.clip(temp_data, -60, 55).astype(np.float32)
    prec_var[:] = np.clip(prec_data, 0, 1200).astype(np.float32)
    wind_var[:] = np.clip(wind_data, 0, 200).astype(np.float32)
    
    ds.close()
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    public_datasets_dir = os.path.join("public", "datasets")
    if not os.path.exists(public_datasets_dir):
        os.makedirs(public_datasets_dir)
        
    target_path = os.path.join(public_datasets_dir, "Biosphere_Pulse_2025.nc")
    generate_perfect_dataset(target_path)
