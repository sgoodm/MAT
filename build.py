from osgeo import gdal,ogr
import struct
import sys
import csv

#sys.argv[0] is file name sent to python
myType = sys.argv[1]
myData = sys.argv[2]
myId = sys.argv[3]
myLon = sys.argv[4]
myLat = sys.argv[5]
myRaster = sys.argv[6]
myOutput = sys.argv[7]
myName = sys.argv[8]
myInclude = sys.argv[9]

src_filename = myRaster
src_ds=gdal.Open(src_filename) 
gt=src_ds.GetGeoTransform()
rb=src_ds.GetRasterBand(1)

with open(myOutput, 'w') as f:
	header =  myId +","+ myLon +","+ myLat +","

	includes = myInclude.split(",")
	for field in range(0, len(includes)):
		header += includes[field] + ","  
	
	header += myName + "\n" 
	f.write(header)
	
	c = 0


	if (myType == "vector"):

		shp_filename = myData
		ds=ogr.Open(shp_filename)
		lyr=ds.GetLayer()

		for feat in lyr:
			geom = feat.GetGeometryRef()
			field_vals = []

			try:
				feat_id = feat.GetField(myId)
			except:
				feat_id = c

			for field in range(0, len(includes)):
				try:
					field_vals.append( feat.GetField(includes[field]) )
				except:
					field_vals.append( "BAD" )

			
			c += 1

			mx,my=geom.GetX(), geom.GetY()  #coord in map units

			#Convert from map to pixel coordinates.
			#Only works for geotransforms with no rotation.
			px = int((mx - gt[0]) / gt[1]) #x pixel
			py = int((my - gt[3]) / gt[5]) #y pixel

			structval=rb.ReadRaster(px,py,1,1,buf_type=gdal.GDT_Float32)
			intval = struct.unpack('f' , structval) 

			newRow = str(feat_id) + "," + str(mx) + "," + str(my) + "," 

			for field in range(0, len(includes)):
				newRow += str(field_vals[field]) + "," 

			newRow += str(intval[0])+"\n"

			f.write(newRow)


	else:

		with open (myData, 'rb') as myCSV:
			csvData = csv.DictReader(myCSV, delimiter=",")

			for row in csvData:
				mx = float(row[myLon])
				my = float(row[myLat])

				try:
					feat_id = row[myId]
				except:
					feat_id = c

				for field in range(0, len(includes)):
					try:
						field_vals.append( row[includes[field]] )
					except:
						field_vals.append( "BAD" )

				c += 1

				px = int((mx - gt[0]) / gt[1]) #x pixel
				py = int((my - gt[3]) / gt[5]) #y pixel

				structval=rb.ReadRaster(px, py, 1, 1, buf_type=gdal.GDT_Float32) 
				intval = struct.unpack('f' , structval)

				newRow = str(feat_id) + "," + str(mx) + "," + str(my) + "," 

				for field in range(0, len(includes)):
					newRow += str(field_vals[field]) + "," 

				newRow += str(intval[0])+"\n"

				f.write(newRow)