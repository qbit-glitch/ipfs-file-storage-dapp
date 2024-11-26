import axios from 'axios';

const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1Mzc1NjNkNy00ZmE3LTRmM2QtYTI5OC03NzkyZTg4NTYwYzgiLCJlbWFpbCI6InF1YW50dW1zZWN1cmVieXRlc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiYzFhYWEwZjIwY2Q2MmQwNWVmMWIiLCJzY29wZWRLZXlTZWNyZXQiOiIzMTE2NGU3NmNmMjllY2QyY2I4ZWQxYmE5OTY4NzM3N2NjN2RiNTM2NTc4NjZlNjc1NWE3ZWM5ODFmYjdhOGQ1IiwiZXhwIjoxNzY0MTA1MzExfQ.jl0bkT_N6GbA0Dlx3IY32inddhsAaFJOUrith1PcELE";

export const uploadToPinata = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          'Authorization': `Bearer ${JWT}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};